import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Course {
  id?: string;
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

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}`, course);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }
}
