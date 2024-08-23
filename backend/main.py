from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError, ConnectionFailure, OperationFailure
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import requests
import uvicorn
import os
import certifi
import urllib.parse
from io import StringIO
from dotenv import load_dotenv

load_dotenv()

MONGODB_USERNAME = os.getenv('MONGODB_USERNAME')
MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD')

app = FastAPI(
    title="Course Management API",
    description="An API for managing university courses",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Atlas connection
username = urllib.parse.quote_plus(MONGODB_USERNAME)
password = urllib.parse.quote_plus(MONGODB_PASSWORD)

MONGODB_URI = f"mongodb+srv://{username}:{password}@data-service.mypoi.mongodb.net/?retryWrites=true&w=majority&appName=data-service"

try:
    client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    client.admin.command('ismaster')
    print("Successfully connected to MongoDB")

    db = client.courses_db
    courses_collection = db.courses

    if "courses" in db.list_collection_names():
        print(f"'courses' collection exists in 'courses_db'")
        print(f"Number of documents in 'courses' collection: {courses_collection.count_documents({})}")
    else:
        print(f"'courses' collection does not exist in 'courses_db'")

except ConnectionFailure as e:
    print(f"Failed to connect to MongoDB: {e}")
except OperationFailure as e:
    print(f"Authentication failed: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# Models
class Course(BaseModel):
    university: str
    city: str
    country: str
    course_name: str
    course_description: str
    start_date: datetime
    end_date: datetime
    price: float
    currency: str

class CourseInDB(Course):
    id: str = Field(alias="_id")

class Config:
    allow_population_by_field_name = True


class CourseUpdate(BaseModel):
    university: str | None = None
    city: str | None = None
    country: str | None = None
    course_name: str | None = None
    course_description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    price: float | None = None
    currency: str | None = None

# Helper functions
def fetch_and_update_data():
    try:
        url = "https://api.mockaroo.com/api/501b2790?count=100&key=8683a1c0"
        response = requests.get(url)
        df = pd.read_csv(StringIO(response.text))

        courses = df.to_dict('records')
        for course in courses:
            course['StartDate'] = datetime.strptime(course['StartDate'], '%Y-%m-%d')
            course['EndDate'] = datetime.strptime(course['EndDate'], '%Y-%m-%d')
        courses_collection.delete_many({})
        result = courses_collection.insert_many(courses)
        print(f"Inserted {len(result.inserted_ids)} documents into 'courses' collection")
        courses_collection.create_index("timestamp", expireAfterSeconds=600)
    except Exception as e:
        print(f"Error fetching and updating data: {e}")

def check_data_expiration():
    try:
        count = courses_collection.count_documents({})
        print(f"Number of documents in 'courses' collection: {count}")
        if count == 0:
            print("No documents found. Fetching new data...")
            fetch_and_update_data()
        else:
            print("Documents found. No need to fetch new data.")
    except Exception as e:
        print(f"Error checking data expiration: {e}")

# Root route
@app.get("/", tags=["Root"])
async def root():
    return JSONResponse(
        status_code=200,
        content={
            "message": "Welcome to the Course Management API",
            "version": "1.0.0",
            "endpoints": {
                "courses": "/courses",
                "course": "/courses/{course_id}",
                "docs": "/docs",
                "openapi": "/openapi.json"
            }
        }
    )

# Routes
@app.get("/courses", response_model=List[CourseInDB], tags=["Courses"])
async def get_courses(
        search: str = Query(None, description="Search term for filtering courses"),
        page: int = Query(1, ge=1, description="Page number for pagination"),
        items_per_page: int = Query(10, ge=1, le=100, description="Number of items per page")
):
    check_data_expiration()

    skip = (page - 1) * items_per_page

    query = {}
    if search:
        query = {
            "$or": [
                {"University": {"$regex": search, "$options": "i"}},
                {"City": {"$regex": search, "$options": "i"}},
                {"Country": {"$regex": search, "$options": "i"}},
                {"CourseName": {"$regex": search, "$options": "i"}},
                {"CourseDescription": {"$regex": search, "$options": "i"}},
            ]
        }

    courses = list(courses_collection.find(query).skip(skip).limit(items_per_page))
    return [CourseInDB(
        _id=str(course["_id"]),
        university=course["University"],
        city=course["City"],
        country=course["Country"],
        course_name=course["CourseName"],
        course_description=course["CourseDescription"],
        start_date=course["StartDate"],
        end_date=course["EndDate"],
        price=course["Price"],
        currency=course["Currency"]
    ) for course in courses]


@app.put("/courses/{course_id}", response_model=CourseInDB, tags=["Courses"])
async def update_course(course_id: str, course_update: CourseUpdate):
    check_data_expiration()

    update_data = {}
    if course_update.university:
        update_data["University"] = course_update.university
    if course_update.city:
        update_data["City"] = course_update.city
    if course_update.country:
        update_data["Country"] = course_update.country
    if course_update.course_name:
        update_data["CourseName"] = course_update.course_name
    if course_update.course_description:
        update_data["CourseDescription"] = course_update.course_description
    if course_update.start_date:
        update_data["StartDate"] = course_update.start_date
    if course_update.end_date:
        update_data["EndDate"] = course_update.end_date
    if course_update.price:
        update_data["Price"] = course_update.price
    if course_update.currency:
        update_data["Currency"] = course_update.currency

    course = courses_collection.find_one_and_update(
        {"_id": ObjectId(course_id)},
        {"$set": update_data},
        return_document=True
    )

    if course:
        return CourseInDB(
            _id=str(course["_id"]),
            university=course["University"],
            city=course["City"],
            country=course["Country"],
            course_name=course["CourseName"],
            course_description=course["CourseDescription"],
            start_date=course["StartDate"],
            end_date=course["EndDate"],
            price=course["Price"],
            currency=course["Currency"]
        )
    raise HTTPException(status_code=404, detail="Course not found")

@app.delete("/courses/{course_id}", tags=["Courses"])
async def delete_course(course_id: str):
    check_data_expiration()

    result = courses_collection.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 1:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Course not found")

@app.post("/courses", response_model=CourseInDB, tags=["Courses"])
async def create_course(course: Course):
    check_data_expiration()

    try:
        course_dict = course.dict()
        course_dict["University"] = course_dict.pop("university")
        course_dict["City"] = course_dict.pop("city")
        course_dict["Country"] = course_dict.pop("country")
        course_dict["CourseName"] = course_dict.pop("course_name")
        course_dict["CourseDescription"] = course_dict.pop("course_description")
        course_dict["StartDate"] = course_dict.pop("start_date")
        course_dict["EndDate"] = course_dict.pop("end_date")
        course_dict["Price"] = course_dict.pop("price")
        course_dict["Currency"] = course_dict.pop("currency")

        result = courses_collection.insert_one(course_dict)
        new_course = courses_collection.find_one({"_id": result.inserted_id})
        return CourseInDB(
            _id=str(new_course["_id"]),
            university=new_course["University"],
            city=new_course["City"],
            country=new_course["Country"],
            course_name=new_course["CourseName"],
            course_description=new_course["CourseDescription"],
            start_date=new_course["StartDate"],
            end_date=new_course["EndDate"],
            price=new_course["Price"],
            currency=new_course["Currency"]
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Course already exists")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)