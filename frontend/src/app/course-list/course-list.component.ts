import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Course, CourseService } from '../course.service';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  searchForm: FormGroup;
  filteredOptions: Observable<string[]>;
  displayedColumns: string[] = [
    'university',
    'course_name',
    'start_date',
    'end_date',
    'price',
    'actions',
  ];

  constructor(private courseService: CourseService) {
    this.searchForm = new FormGroup({
      searchControl: new FormControl(''),
    });

    this.filteredOptions = this.searchForm
      .get('searchControl')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value || ''))
      );
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    const searchTerm = this.searchForm.get('searchControl')!.value || '';
    this.courseService
      .getCourses(searchTerm, this.currentPage, this.itemsPerPage)
      .subscribe((courses) => {
        this.courses = courses;
        // Update filtered options when courses are loaded
        this.filteredOptions = this.searchForm
          .get('searchControl')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filter(value || ''))
          );
      });
  }

  onSearch(event: Event): void {
    event.preventDefault(); // Prevent form submission
    this.currentPage = 1;
    this.loadCourses();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadCourses();
  }

  deleteCourse(id: string): void {
    this.courseService.deleteCourse(id).subscribe(() => {
      this.loadCourses();
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const allOptions = this.courses.map((course) => course.course_name);
    const uniqueOptions = Array.from(new Set(allOptions)); // Remove duplicates
    return uniqueOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
}
