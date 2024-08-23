import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course, CourseService } from '../course.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CURRENCIES } from '../constants/currencySymbols';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
})
export class CourseFormComponent implements OnInit {
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

  currencies: { code: string; name: string }[] = Object.entries(CURRENCIES).map(
    ([code, details]) => ({
      code,
      name: details.name,
    })
  );

  minDate: Date;

  constructor(private courseService: CourseService) {
    this.minDate = new Date(); // Set minDate to today
  }
  ngOnInit() {}

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
