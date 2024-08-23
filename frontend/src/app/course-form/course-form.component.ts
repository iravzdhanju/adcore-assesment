import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Course, CourseService } from '../course.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CURRENCIES } from '../constants/currencySymbols';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  universityControl = new FormControl('');

  currencies: { code: string; name: string }[] = Object.entries(CURRENCIES).map(
    ([code, details]) => ({
      code,
      name: details.name,
    })
  );

  minDate: Date;
  filteredUniversities: Observable<string[]>;
  universities: string[] = [];
  isLoading: boolean = true;

  constructor(private courseService: CourseService, private fb: FormBuilder) {
    this.minDate = new Date();
    this.filteredUniversities = of([]);

    this.courseForm = this.fb.group({
      university: this.universityControl,
      city: [''],
      country: [''],
      course_name: [''],
      course_description: [''],
      start_date: [''],
      end_date: [''],
      price: [0],
      currency: [''],
    });
  }

  ngOnInit() {
    this.loadUniversities();
  }

  loadUniversities() {
    this.isLoading = true;
    this.courseService.getUniversities().subscribe(
      (universities) => {
        this.universities = universities;
        this.setupUniversityAutocomplete();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching universities:', error);
        this.isLoading = false;
      }
    );
  }

  setupUniversityAutocomplete() {
    this.filteredUniversities = this.universityControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.universities.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      const courseData: Course = {
        ...this.courseForm.value,
        _id: '', // Assuming _id is not needed for creation
      };
      this.courseService.createCourse(courseData).subscribe({
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
  }

  resetForm(): void {
    this.courseForm.reset({
      university: '',
      city: '',
      country: '',
      course_name: '',
      course_description: '',
      start_date: '',
      end_date: '',
      price: 0,
      currency: '',
    });
  }
}
