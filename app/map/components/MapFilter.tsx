'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';

// hooks
import useAlert from '@hooks/useAlert';

// components
import Input from '@components/Form/Input';

// styles
import styles from './MapFilter.module.css';

// interfaces
interface IFilterFormProps {
  keyword: string;
  state: string;
  city: string;
  date: Date | null;
  categories: string[];
}

interface MapFilterProps {
  onFilterChange: (filters: IFilterFormProps) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  className?: string;
  initialFilters?: IFilterFormProps;
}

// Calendar component for date selection
const Calendar = ({
  selectedDate,
  onDateSelect,
  onClose,
}: {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  
  // Get current display month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Calculate first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Handle previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setFocusedDay(null);
  };
  
  // Handle next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setFocusedDay(null);
  };
  
  // Handle today button click
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setFocusedDay(today.getDate());
  };
  
  // Check if date is before today (for disabling past dates)
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Handle keyboard navigation
  const handleCalendarKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedDay) {
      setFocusedDay(1);
      return;
    }
    
    // Today's date for reference
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Current focused date
    const focusedDate = new Date(currentYear, currentMonth, focusedDay);
    
    switch (e.key) {
      case 'ArrowRight':
        if (focusedDay < daysInMonth) {
          setFocusedDay(focusedDay + 1);
        } else {
          // Move to next month
          handleNextMonth();
          setFocusedDay(1);
        }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (focusedDay > 1) {
          setFocusedDay(focusedDay - 1);
        } else {
          // Move to previous month
          handlePrevMonth();
          // Set to last day of previous month
          const lastDayPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
          setFocusedDay(lastDayPrevMonth);
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (focusedDay + 7 <= daysInMonth) {
          setFocusedDay(focusedDay + 7);
        } else {
          // Move to next month
          handleNextMonth();
          setFocusedDay(Math.min(focusedDay + 7 - daysInMonth, new Date(currentYear, currentMonth + 1, 0).getDate()));
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (focusedDay - 7 >= 1) {
          setFocusedDay(focusedDay - 7);
        } else {
          // Move to previous month
          handlePrevMonth();
          // Calculate equivalent position in previous month
          const lastDayPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
          setFocusedDay(lastDayPrevMonth - (7 - focusedDay));
        }
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (focusedDay) {
          const selectedDate = new Date(currentYear, currentMonth, focusedDay);
          if (!isDateDisabled(selectedDate)) {
            onDateSelect(selectedDate);
            onClose();
          }
        }
        e.preventDefault();
        break;
      case 'Escape':
        onClose();
        e.preventDefault();
        break;
      case 'Home':
        setFocusedDay(1);
        e.preventDefault();
        break;
      case 'End':
        setFocusedDay(daysInMonth);
        e.preventDefault();
        break;
      case 'PageUp':
        handlePrevMonth();
        e.preventDefault();
        break;
      case 'PageDown':
        handleNextMonth();
        e.preventDefault();
        break;
    }
  };
  
  // Render calendar days
  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      const disabled = isDateDisabled(date);
      const isFocused = focusedDay === day;
      
      days.push(
        <button
          key={day}
          type="button"
          className={`
            ${styles.dayButton}
            ${isToday ? styles.today : ''}
            ${isSelected ? styles.selected : ''}
            ${disabled ? styles.disabled : ''}
            ${isFocused && !isSelected ? styles.focused : ''}
          `}
          onClick={() => {
            if (!disabled) {
              onDateSelect(date);
              onClose();
            }
          }}
          disabled={disabled}
          aria-label={format(date, 'MMMM d, yyyy')}
          aria-selected={isSelected || undefined}
          aria-current={isToday ? 'date' : undefined}
          tabIndex={isFocused ? 0 : -1}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };
  
  // Weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div 
      className={styles.calendar}
      onKeyDown={handleCalendarKeyDown}
      tabIndex={0}
    >
      <div className={styles.calendarHeader}>
        <button 
          type="button" 
          className={styles.navButton}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className={styles.monthYearDisplay}>
          {format(currentDate, 'MMMM yyyy')}
        </div>
        <button 
          type="button" 
          className={styles.navButton}
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div className={styles.weekdayHeader}>
        {weekdays.map(day => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.daysGrid}>
        {renderCalendarDays()}
      </div>
      <div className={styles.calendarFooter}>
        <button 
          type="button" 
          className={styles.footerButton}
          onClick={handleTodayClick}
        >
          Today
        </button>
        <button 
          type="button" 
          className={styles.footerButton}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Category button component
interface CategoryButtonProps {
  icon: string;
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, text, isSelected, onClick }) => (
  <button
    type="button"
    className={`${styles.categoryButton} ${isSelected ? styles.categorySelected : ''}`}
    onClick={onClick}
    aria-pressed={isSelected}
    aria-label={`${text} category ${isSelected ? 'selected' : ''}`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className={styles.categoryText}>{text}</span>
  </button>
);

// Available categories
const eventCategories = [
  { icon: 'music_note', text: 'Music' },
  { icon: 'theater_comedy', text: 'Comedy' },
  { icon: 'local_activity', text: 'Theatre' },
  { icon: 'nightlife', text: 'Festival' },
  { icon: 'sports_baseball', text: 'Sports' },
  { icon: 'family_restroom', text: 'Family' },
  { icon: 'brush', text: 'Arts' },
  { icon: 'diversity_3', text: 'Other' },
];

// Main MapFilter component
const MapFilter: React.FC<MapFilterProps> = ({ 
  onFilterChange, 
  onLoadingChange,
  className = '',
  initialFilters
}) => {
  const { showAlert, hideAlert } = useAlert();
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // State references for dropdowns
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  
  // Dropdown focus tracking
  const [focusedStateIndex, setFocusedStateIndex] = useState(-1);
  const [focusedCityIndex, setFocusedCityIndex] = useState(-1);
  
  // Initialize form values with defaults or from the initialFilters prop
  const [formValues, setFormValues] = useState<IFilterFormProps>({
    keyword: initialFilters?.keyword || '',
    state: initialFilters?.state || 'Any State',
    city: initialFilters?.city || 'Any City',
    date: initialFilters?.date || null,
    categories: initialFilters?.categories || [],
  });
  
  // Available states
  const states = [
    'Any State', 
    'AL', 'CA', 'FL', 'GA', 
    'IL', 'NY', 'OH', 'PA', 
    'TX'
  ];
  
  // State to cities mapping

  // TODO#3 Just use similar logic as FormSearch.tsx
  const stateCities: Record<string, string[]> = {
    'Any State': ['Any City'],
    'AL': ['Any City', 'Birmingham', 'Huntsville', 'Mobile', 'Montgomery'],
    'CA': ['Any City', 'Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Oakland'],
    'FL': ['Any City', 'Jacksonville', 'Miami', 'Orlando', 'Tampa'],
    'GA': ['Any City', 'Atlanta', 'Augusta', 'Columbus', 'Savannah'],
    'IL': ['Any City', 'Chicago', 'Springfield', 'Peoria', 'Rockford'],
    'NY': ['Any City', 'New York', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
    'OH': ['Any City', 'Cleveland', 'Cincinnati', 'Columbus', 'Toledo'],
    'PA': ['Any City', 'Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
    'TX': ['Any City', 'Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth']
  };
  
  // Get cities based on selected state
  const getCitiesForState = useCallback((state: string): string[] => {
    return stateCities[state] || ['Any City'];
  }, []);
  
  // Available cities based on selected state
  const [availableCities, setAvailableCities] = useState<string[]>(
    getCitiesForState(formValues.state)
  );
  
  // Update loading state
  const updateLoadingState = (loading: boolean) => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  };
  
  // Initialize client-side state
  useEffect(() => {
    setIsMounted(true);
    setWindowWidth(window.innerWidth);
    
    // Set up resize and click handlers
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      // Use a ref to track if we need to update state to avoid unnecessary renders
      let shouldUpdate = false;
      
      // Close dropdowns when clicking outside
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        if (showStateDropdown) {
          shouldUpdate = true;
          setShowStateDropdown(false);
        }
      }
      
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        if (showCityDropdown) {
          shouldUpdate = true;
          setShowCityDropdown(false);
        }
      }
      
      if (dateRef.current && !dateRef.current.contains(event.target as Node) && 
          !(event.target as Element).closest(`.${styles.calendar}`)) {
        if (showDatePicker) {
          shouldUpdate = true;
          setShowDatePicker(false);
        }
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close all dropdowns on Escape key
      if (event.key === 'Escape') {
        setShowStateDropdown(false);
        setShowCityDropdown(false);
        setShowDatePicker(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Update available cities when state changes
  useEffect(() => {
    setAvailableCities(getCitiesForState(formValues.state));
  }, [formValues.state, getCitiesForState]);
  
  // Calculate dropdown position
  const getDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) {
      return { top: 0, left: 0, width: 0 };
    }
    
    const rect = ref.current.getBoundingClientRect();
    
    // For mobile, center the dropdown
    if (windowWidth < 768) {
      return {
        top: rect.bottom + window.scrollY + 5,
        left: window.innerWidth / 2,
        width: Math.min(300, rect.width),
      };
    }
    
    // For desktop, position below the button
    return {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };
  
  // Handle keyboard navigation for dropdowns
  const handleKeyDown = (
    e: React.KeyboardEvent,
    items: string[],
    currentIndex: number,
    setIndex: (index: number) => void,
    onSelect: (item: string) => void
  ) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndex(currentIndex < items.length - 1 ? currentIndex + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndex(currentIndex > 0 ? currentIndex - 1 : items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          onSelect(items[currentIndex]);
        }
        break;
      case 'Home':
        e.preventDefault();
        setIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setIndex(items.length - 1);
        break;
    }
  };
  
  // Fix the input handler to correctly update form values
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // Prevent default behavior that might be causing reloads
    e.preventDefault();
    
    // Update form values with the new input value
    setFormValues(prevValues => ({
      ...prevValues,
      [name]: value,
    }));
  };
  
  // Selection handlers
  const handleStateSelect = (state: string): void => {
    setFormValues(prevValues => ({
      ...prevValues,
      state,
      city: 'Any City', // Reset city when state changes
    }));
    setShowStateDropdown(false);
    setFocusedStateIndex(-1);
  };
  
  const handleCitySelect = (city: string): void => {
    setFormValues(prevValues => ({
      ...prevValues,
      city,
    }));
    setShowCityDropdown(false);
    setFocusedCityIndex(-1);
  };
  
  const handleDateSelect = (date: Date): void => {
    setFormValues(prevValues => ({
      ...prevValues,
      date,
    }));
    setShowDatePicker(false);
  };
  
  // Category toggle handler
  const handleCategoryToggle = (category: string): void => {
    setFormValues(prev => {
      const currentCategories = [...prev.categories];
      const index = currentCategories.indexOf(category);
      
      if (index === -1) {
        // Add category if not already selected
        return { ...prev, categories: [...currentCategories, category] };
      } else {
        // Remove category if already selected
        currentCategories.splice(index, 1);
        return { ...prev, categories: currentCategories };
      }
    });
  };
  
  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select Date';
    try {
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Select Date';
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    // Start loading
    updateLoadingState(true);
    
    // Call the filter change handler with the current form state
    onFilterChange({
      keyword: formValues.keyword,
      state: formValues.state,
      city: formValues.city,
      date: formValues.date,
      categories: formValues.categories
    });
    
    // Note: The loading state will be turned off by the parent component
    // when the filtering operation is complete
  };

  // Render loading placeholders if not mounted
  if (!isMounted) {
    return (
      <div className={`${styles.filterContainer} ${className}`}>
        <div className={styles.filterForm}>
          <h3 className={styles.filterTitle}>Filter Events</h3>
          <div className={styles.formGrid}>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>Keyword</div>
              <div className={styles.loadingPlaceholder}></div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>State</div>
              <div className={styles.loadingPlaceholder}></div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>City</div>
              <div className={styles.loadingPlaceholder}></div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>Date</div>
              <div className={styles.loadingPlaceholder}></div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.loadingPlaceholder} style={{ marginTop: '1.95rem' }}></div>
            </div>
          </div>
          <div className={styles.categoriesSection}>
            <h4 className={styles.categoriesTitle}>Categories</h4>
            <div className={styles.categoriesContainer}>
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className={styles.categoryPlaceholder}></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${styles.filterContainer} ${className}`}>
      <form noValidate onSubmit={handleSubmit} className={styles.filterForm}>
        <h3 className={styles.filterTitle}>Filter Events</h3>
        
        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Keyword</label>
            <Input
              type='text'
              name='keyword'
              value={formValues.keyword}
              maxLength={64}
              placeholder='Event, venue, artist, name'
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>State</label>
            <div className={styles.dropdownContainer} ref={stateRef}>
              <button
                type='button'
                className={styles.dropdownButton}
                onClick={() => {
                  setShowStateDropdown(!showStateDropdown);
                  setShowCityDropdown(false);
                  setShowDatePicker(false);
                  setFocusedStateIndex(-1);
                }}
                aria-haspopup='listbox'
                aria-expanded={showStateDropdown}
                aria-label='Select a state'
              >
                <span>{formValues.state}</span>
                <span className='material-symbols-outlined'>
                  {showStateDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted &&
                showStateDropdown &&
                createPortal(
                  <div
                    id='state-dropdown-portal'
                    className={styles.dropdownMenu}
                    role='listbox'
                    tabIndex={-1}
                    aria-activedescendant={
                      focusedStateIndex >= 0 ? `state-option-${focusedStateIndex}` : undefined
                    }
                    style={{
                      position: 'fixed',
                      top: getDropdownPosition(stateRef).top,
                      left: getDropdownPosition(stateRef).left,
                      width: windowWidth < 768 ? 'auto' : getDropdownPosition(stateRef).width,
                      maxWidth: windowWidth < 768 ? '300px' : getDropdownPosition(stateRef).width,
                      transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                      zIndex: 9999,
                    }}
                    onKeyDown={(e) =>
                      handleKeyDown(
                        e,
                        states,
                        focusedStateIndex,
                        setFocusedStateIndex,
                        handleStateSelect
                      )
                    }
                    key={`state-dropdown-${forceUpdate}`}
                  >
                    {states.map((state, index) => (
                      <div
                        key={state}
                        className={`${styles.dropdownItem} ${
                          focusedStateIndex === index ? styles.focused : ''
                        }`}
                        onClick={() => handleStateSelect(state)}
                        role='option'
                        aria-selected={formValues.state === state}
                        id={`state-option-${index}`}
                        tabIndex={-1}
                      >
                        {state}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
            </div>
          </div>
          
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>City</label>
            <div className={styles.dropdownContainer} ref={cityRef}>
              <button
                type='button'
                className={styles.dropdownButton}
                onClick={() => {
                  setShowCityDropdown(!showCityDropdown);
                  setShowStateDropdown(false);
                  setShowDatePicker(false);
                  setFocusedCityIndex(-1);
                }}
                aria-haspopup='listbox'
                aria-expanded={showCityDropdown}
                aria-label='Select a city'
              >
                <span>{formValues.city}</span>
                <span className='material-symbols-outlined'>
                  {showCityDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted &&
                showCityDropdown &&
                createPortal(
                  <div
                    id='city-dropdown-portal'
                    className={styles.dropdownMenu}
                    role='listbox'
                    tabIndex={-1}
                    aria-activedescendant={
                      focusedCityIndex >= 0 ? `city-option-${focusedCityIndex}` : undefined
                    }
                    style={{
                      position: 'fixed',
                      top: getDropdownPosition(cityRef).top,
                      left: getDropdownPosition(cityRef).left,
                      width: windowWidth < 768 ? 'auto' : getDropdownPosition(cityRef).width,
                      maxWidth: windowWidth < 768 ? '300px' : getDropdownPosition(cityRef).width,
                      transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                      zIndex: 9999,
                    }}
                    onKeyDown={(e) =>
                      handleKeyDown(
                        e,
                        availableCities,
                        focusedCityIndex,
                        setFocusedCityIndex,
                        handleCitySelect
                      )
                    }
                    key={`city-dropdown-${forceUpdate}`}
                  >
                    {availableCities.map((city, index) => (
                      <div
                        key={city}
                        className={`${styles.dropdownItem} ${
                          focusedCityIndex === index ? styles.focused : ''
                        }`}
                        onClick={() => handleCitySelect(city)}
                        role='option'
                        aria-selected={formValues.city === city}
                        id={`city-option-${index}`}
                        tabIndex={-1}
                      >
                        {city}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
            </div>
          </div>
          
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Date</label>
            <div className={styles.dropdownContainer} ref={dateRef}>
              <button
                type='button'
                className={styles.dropdownButton}
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowStateDropdown(false);
                  setShowCityDropdown(false);
                }}
                aria-haspopup='dialog'
                aria-expanded={showDatePicker}
                aria-label='Select a date'
              >
                <span>{formatDate(formValues.date)}</span>
                <span className='material-symbols-outlined'>
                  {showDatePicker ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted &&
                showDatePicker &&
                createPortal(
                  <div
                    className={styles.calendarDropdown}
                    style={{
                      position: 'fixed',
                      top: getDropdownPosition(dateRef).top,
                      left: getDropdownPosition(dateRef).left,
                      transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                      zIndex: 9999,
                    }}
                  >
                    <Calendar
                      selectedDate={formValues.date}
                      onDateSelect={handleDateSelect}
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>,
                  document.body
                )}
            </div>
          </div>
          
          <div className={styles.formSection}>
            <button
              type='submit'
              className={styles.filterButton}
              disabled={isLoading}
            >
              <span className={styles.filterIcon}>
                <span className='material-symbols-outlined'>
                  {isLoading ? 'refresh' : 'filter_alt'}
                </span>
              </span>
              {isLoading ? 'Filtering...' : 'Apply Filters'}
            </button>
          </div>
        </div>
        
        <div className={styles.categoriesSection}>
          <h4 className={styles.categoriesTitle}>
            Categories
            {formValues.categories.length > 0 && (
              <span className={styles.selectedCount}>{formValues.categories.length}</span>
            )}
          </h4>
          <div className={styles.categoriesContainer}>
            {eventCategories.map((category) => (
              <CategoryButton
                key={category.text}
                icon={category.icon}
                text={category.text}
                isSelected={formValues.categories.includes(category.text)}
                onClick={() => handleCategoryToggle(category.text)}
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MapFilter; 