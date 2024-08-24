import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Course, CourseService } from '../course.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CURRENCIES } from '../constants/currencySymbols';
import { Observable, of, lastValueFrom } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
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
  minDate = new Date();
  isLoading = true;

  currencies = Object.entries(CURRENCIES).map(([code, details]) => ({
    code,
    name: details.name,
  }));

  universities: string[] = [];
  cities: string[] = [];
  countries: string[] = [];

  filteredUniversities: Observable<string[]> = of([]);
  filteredCities: Observable<string[]> = of([]);
  filteredCountries: Observable<string[]> = of([]);

  constructor(private courseService: CourseService, private fb: FormBuilder) {
    this.courseForm = this.initForm();
  }

  ngOnInit() {
    this.loadData();
  }

  private initForm(): FormGroup {
    return this.fb.group({
      university: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      course_name: ['', Validators.required],
      course_description: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', [Validators.required, this.endDateValidator]],
      price: [0, [Validators.required, Validators.min(0)]],
      currency: ['', Validators.required],
    }, { validators: this.dateRangeValidator });
  }

  private endDateValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.parent?.get('start_date')?.value;
    const endDate = control.value;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { 'endDateInvalid': true };
    }

    return null;
  }

  private dateRangeValidator(form: FormGroup): ValidationErrors | null {
    const startDate = form.get('start_date')?.value;
    const endDate = form.get('end_date')?.value;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { 'dateRangeInvalid': true };
    }

    return null;
  }

  private async loadData() {
    this.isLoading = true;
    try {
      const [universities, cities, countries] = await Promise.all([
        lastValueFrom(this.courseService.getUniversities()),
        lastValueFrom(this.courseService.getCities()),
        lastValueFrom(this.courseService.getCountry()),
      ]);

      this.universities = universities || [];
      this.cities = cities || [];
      this.countries = countries || [];
      this.isLoading = false;
      this.setupAutocompletions();
    } catch (error) {
      console.error('Error loading data:', error);
      this.universities = [];
      this.cities = [];
      this.countries = [];
      this.isLoading = false;
    }
  }

  private setupAutocompletions() {
    try {
      this.filteredUniversities = this.setupAutocomplete('university', this.universities);
      this.filteredCities = this.setupAutocomplete('city', this.cities);
      this.filteredCountries = this.setupAutocomplete('country', this.countries);
    } catch (error) {
      console.error('Error setting up autocompletions:', error);
      this.filteredUniversities = of([]);
      this.filteredCities = of([]);
      this.filteredCountries = of([]);
    }
  }

  private setupAutocomplete(controlName: string, options: string[]): Observable<string[]> {
    const control = this.courseForm.get(controlName);
    if (!control) {
      console.error(`Form control ${controlName} not found`);
      return of([]);
    }
    return control.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', options))
    );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      const courseData: Course = {
        ...this.courseForm.value,
        _id: '', 
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