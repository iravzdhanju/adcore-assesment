import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course, CourseService } from '../course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent {
  course: Course = {
    _id: '',
    university: '',
    city: '',
    country: '',
    course_name: '',
    course_description: '',
    start_date: '',
    end_date: '',
    price: 0,
    currency: '',
  };

  constructor(private courseService: CourseService) {}

  onSubmit(): void {
    this.courseService.createCourse(this.course).subscribe({
      next: () => {
        alert('Course created successfully');
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating course:', error);
        alert('Error creating course');
      },
    });
  }

  resetForm(): void {
    this.course = {
      university: '',
      city: '',
      country: '',
      course_name: '',
      course_description: '',
      start_date: '',
      end_date: '',
      price: 0,
      currency: '',
      _id: '',
    };
  }
}
