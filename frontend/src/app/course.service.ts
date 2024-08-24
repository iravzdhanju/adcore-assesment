import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';
export interface Course {
  _id: string;
  university: string;
  city: string;
  country: string;
  course_name: string;
  course_description: string;
  start_date: string;
  end_date: string;
  price: number;
  currency: string;
}
@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCourses(
    search?: string,
    page: number = 1,
    itemsPerPage: number = 10
  ): Observable<Course[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('items_per_page', itemsPerPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Course[]>(`${this.apiUrl}/courses`, { params });
  }

  getUniversities(): Observable<string[]> {
    return this.getCourses().pipe(
      map((courses) => {
        const universities = courses.map((course) => course.university);
        return Array.from(new Set(universities));
      })
    );
  }
  getCities(): Observable<string[]> {
    return this.getCourses().pipe(
      map((courses) => {
        const city = courses.map((course) => course.city);
        return Array.from(new Set(city));
      })
    );
  }
  
  getCountry(): Observable<string[]> {
    return this.getCourses().pipe(
      map((courses) => {
        const country = courses.map((course) => course.country);
        return Array.from(new Set(country));
      })
    );
  }
  
  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}`, {
      university: course.university,
      city: course.city,
      country: course.country,
      course_name: course.course_name,
      course_description: course.course_description,
      start_date: course.start_date,
      end_date: course.end_date,
      price: course.price,
      currency: course.currency,
      _id: id,
    });
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }
}
