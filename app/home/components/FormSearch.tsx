'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Input from '@components/Form/Input';
import { format } from 'date-fns';
import styles from './FormSearch.module.css';

// hooks
import useAlert from '@hooks/useAlert';

// interfaces
interface IFormProps {
  keyword: string;
  location: string;
  date: Date | null;
  categories: string[];
}

// Adding a Simple Calendar Component
const Calendar = ({ selectedDate, onDateSelect, onClose }: { 
  selectedDate: Date | null, 
  onDateSelect: (date: Date) => void,
  onClose: () => void
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(selectedDate || today);
  const [month, setMonth] = useState(viewDate.getMonth());
  const [year, setYear] = useState(viewDate.getFullYear());
  const [focusedDay, setFocusedDay] = useState<number>(-1);
  
  useEffect(() => {
    setViewDate(new Date(year, month, 1));
  }, [month, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setFocusedDay(-1); // Reset focused day when changing month
  };
  
  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setFocusedDay(-1); // Reset focused day when changing month
  };
  
  const handleTodayClick = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setFocusedDay(today.getDate());
  };
  
  const isDateDisabled = (date: Date) => {
    // Disable past dates
    return date < new Date(today.setHours(0, 0, 0, 0));
  };

  const handleCalendarKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const validDays = daysArray.filter(day => !isDateDisabled(new Date(year, month, day)));
    
    let nextFocus = focusedDay;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (focusedDay === -1) {
          nextFocus = validDays[0] || -1;
        } else {
          const currentIndex = validDays.indexOf(focusedDay);
          nextFocus = currentIndex < validDays.length - 1 ? validDays[currentIndex + 1] : validDays[0];
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (focusedDay === -1) {
          nextFocus = validDays[validDays.length - 1] || -1;
        } else {
          const currentIndex = validDays.indexOf(focusedDay);
          nextFocus = currentIndex > 0 ? validDays[currentIndex - 1] : validDays[validDays.length - 1];
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (focusedDay === -1) {
          nextFocus = validDays[0] || -1;
        } else {
          const nextDay = focusedDay + 7;
          if (nextDay <= daysInMonth && !isDateDisabled(new Date(year, month, nextDay))) {
            nextFocus = nextDay;
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (focusedDay === -1) {
          nextFocus = validDays[validDays.length - 1] || -1;
        } else {
          const prevDay = focusedDay - 7;
          if (prevDay > 0 && !isDateDisabled(new Date(year, month, prevDay))) {
            nextFocus = prevDay;
          }
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedDay !== -1) {
          onDateSelect(new Date(year, month, focusedDay));
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
    
    setFocusedDay(nextFocus);
    
    // Focus the button element if focus changed
    if (nextFocus !== -1) {
      const dayButton = document.getElementById(`day-${nextFocus}`);
      if (dayButton) {
        dayButton.focus();
      }
    }
  };
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.dayButton}></div>);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      const isSelected = selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
      const isFocused = focusedDay === i;
      const disabled = isDateDisabled(date);
      
      const ariaProps = {
        'aria-label': `${monthNames[month]} ${i}, ${year}`,
        'aria-selected': isSelected ? 'true' : 'false'
      };
      
      days.push(
        <button
          id={`day-${i}`}
          key={i}
          type="button"
          disabled={disabled}
          className={`${styles.dayButton} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isFocused ? styles.focused : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => onDateSelect(date)}
          onFocus={() => setFocusedDay(i)}
          onMouseEnter={() => !disabled && setFocusedDay(i)}
          tabIndex={isFocused ? 0 : -1}
          {...ariaProps}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div 
      className={styles.calendar}
      onKeyDown={handleCalendarKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Date picker"
    >
      <div className={styles.calendarHeader}>
        <button 
          type="button" 
          onClick={handlePrevMonth} 
          className={styles.navButton}
          aria-label="Previous month"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className={styles.monthYearDisplay} aria-live="polite">
          {monthNames[month]} {year}
        </div>
        <button 
          type="button" 
          onClick={handleNextMonth} 
          className={styles.navButton}
          aria-label="Next month"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      
      <div className={styles.weekdayHeader} role="row">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className={styles.weekday} role="columnheader" aria-label={day}>
            {day}
          </div>
        ))}
      </div>
      
      <div className={styles.daysGrid} role="grid">
        {renderCalendarDays()}
      </div>
      
      <div className={styles.calendarFooter}>
        <button 
          type="button" 
          onClick={handleTodayClick} 
          className={styles.footerButton}
          aria-label="Go to today"
        >
          Today
        </button>
        <button 
          type="button" 
          onClick={onClose} 
          className={styles.footerButton}
          aria-label="Close calendar"
        >
          Close
        </button>
      </div>
    </div>
  );
};
// End of Calendar Component
// 

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
  { icon: 'theater_comedy', text: 'Theater' },
  { icon: 'stadium', text: 'Concert' },
  { icon: 'child_care', text: 'Kids' },
  { icon: 'sports_football', text: 'Sports' },
  { icon: 'attractions', text: 'Attractions' },
  { icon: 'piano', text: 'Musical' },
  { icon: 'comedy_mask', text: 'Comedy' },
  { icon: 'festival', text: 'Festival' }
];

const FormSearch: React.FC = () => {
  const { showAlert } = useAlert();
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  const [formValues, setFormValues] = useState<IFormProps>({
    keyword: '',
    location: 'Any Location',
    date: null,
    categories: [],
  });

  const locations = ['Any Location', 'New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'];
  
  // Refs for dropdown containers
  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  
  // Set mounted state for client-side rendering and track window width
  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Function to get dropdown position
  const getDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { top: 0, left: 0, width: 0 };
    
    const rect = ref.current.getBoundingClientRect();
    
    // For mobile view, position centered but below the button
    if (windowWidth < 768) {
      return {
        top: rect.bottom + window.scrollY + 5, // Add a small gap
        left: windowWidth / 2,
        transform: 'translateX(-50%)',
        width: Math.min(300, windowWidth * 0.9),
        maxWidth: Math.min(300, windowWidth * 0.9)
      };
    }
    
    // For desktop view, position below the button
    return {
      top: rect.bottom + window.scrollY + 5, // Add a small gap
      left: rect.left + window.scrollX,
      transform: 'none',
      width: rect.width,
      maxWidth: rect.width
    };
  };

  // Add keyboard navigation handler for dropdown items
  const handleKeyDown = (e: React.KeyboardEvent, items: string[], currentIndex: number, setIndex: (index: number) => void, onSelect: (item: string) => void) => {
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
      case 'Escape':
        e.preventDefault();
        setShowLocationDropdown(false);
        setShowDatePicker(false);
        break;
      default:
        break;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside the dropdown portal
        const locationDropdownElement = document.getElementById('location-dropdown-portal');
        if (locationDropdownElement && locationDropdownElement.contains(event.target as Node)) {
          return;
        }
        setShowLocationDropdown(false);
      }
      
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside the calendar portal
        const calendarElement = document.getElementById('calendar-dropdown-portal');
        if (calendarElement && calendarElement.contains(event.target as Node)) {
          return;
        }
        setShowDatePicker(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowLocationDropdown(false);
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Handles the change event for form inputs.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The event object from the input change.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const [focusedLocationIndex, setFocusedLocationIndex] = useState<number>(-1);

  const handleLocationSelect = (location: string): void => {
    setFormValues({ ...formValues, location });
    setShowLocationDropdown(false);
  };

  const handleDateSelect = (date: Date): void => {
    setFormValues({ ...formValues, date });
    setShowDatePicker(false);
  };

  /**
   * Handles the selection of an event category.
   * If the category is already selected, it will be removed, otherwise added.
   */
  const handleCategoryToggle = (category: string): void => {
    setFormValues(prev => {
      const currentCategories = [...prev.categories];
      
      // If category is already selected, remove it
      if (currentCategories.includes(category)) {
        return {
          ...prev,
          categories: currentCategories.filter(cat => cat !== category)
        };
      } 
      // Otherwise add it
      else {
        return {
          ...prev,
          categories: [...currentCategories, category]
        };
      }
    });
  };

  /**
   * Handles the form submission event.
   *
   * Prevents the default form submission behavior, checks if the keyword input is valid (minimum 3 characters),
   * and displays an error alert if the input is invalid.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The event object from the form submission.
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    const { keyword, location, date, categories } = formValues;
    
    // Validate search input
    if ((keyword === '' || keyword.length < 3) && categories.length === 0) {
      showAlert({ 
        type: 'error', 
        text: 'Please enter minimum 3 characters for search or select at least one category.' 
      });
      return;
    }
    
    // Log the search parameters for now (would be replaced with actual search implementation)
    console.log('Search with parameters:', {
      keyword,
      location,
      date: date ? format(date, 'yyyy-MM-dd') : null,
      categories
    });
    
    // Here you would normally call an API or dispatch an action to perform the search
  };

  // Function to format date
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select Date';
    try {
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Select Date';
    }
  };

  // Render only on client-side
  if (!isMounted) {
    return (
      <div className={styles.searchContainer}>
        <div className={styles.searchForm}>
          <h3 className={styles.searchTitle}>Find Events</h3>
          <div className={styles.formGrid}>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>Keywords</div>
              <div className={styles.loadingPlaceholder}></div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.inputLabel}>Location</div>
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
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className={styles.categoryPlaceholder}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchContainer}>
      <form noValidate onSubmit={handleSubmit} className={styles.searchForm}>
        <h3 className={styles.searchTitle}>Find Events</h3>
        
        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Keywords</label>
            <Input
              type='text'
              name='keyword'
              value={formValues.keyword}
              maxLength={64}
              placeholder='Event, venue, artist, keyword'
              required
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Location</label>
            <div className={styles.dropdownContainer} ref={locationRef}>
              <button 
                type="button"
                className={styles.dropdownButton}
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                aria-haspopup="listbox"
                aria-expanded={showLocationDropdown}
                aria-label="Select a location"
              >
                <span>{formValues.location}</span>
                <span className="material-symbols-outlined">
                  {showLocationDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted && showLocationDropdown && createPortal(
                <div 
                  id="location-dropdown-portal"
                  className={styles.dropdownMenu}
                  role="listbox"
                  tabIndex={-1}
                  aria-activedescendant={focusedLocationIndex >= 0 ? `location-option-${focusedLocationIndex}` : undefined}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(locationRef).top,
                    left: getDropdownPosition(locationRef).left,
                    width: windowWidth < 768 ? 'auto' : getDropdownPosition(locationRef).width,
                    maxWidth: windowWidth < 768 ? '300px' : getDropdownPosition(locationRef).width,
                    transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                    zIndex: 9999
                  }}
                  onKeyDown={(e) => handleKeyDown(e, locations, focusedLocationIndex, setFocusedLocationIndex, handleLocationSelect)}
                >
                  {locations.map((location, index) => (
                    <div 
                      key={location}
                      id={`location-option-${index}`}
                      className={`${styles.dropdownItem} ${focusedLocationIndex === index ? styles.focused : ''}`}
                      onClick={() => handleLocationSelect(location)}
                      role="option"
                      aria-selected={formValues.location === location}
                      tabIndex={0}
                      onMouseEnter={() => setFocusedLocationIndex(index)}
                      onFocus={() => setFocusedLocationIndex(index)}
                    >
                      {location}
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
                type="button"
                className={styles.dropdownButton}
                onClick={() => setShowDatePicker(!showDatePicker)}
                aria-haspopup="dialog"
                aria-expanded={showDatePicker}
                aria-label="Select a date"
              >
                <span>{formatDate(formValues.date)}</span>
                <span className="material-symbols-outlined">calendar_month</span>
              </button>
              
              {isMounted && showDatePicker && createPortal(
                <div 
                  id="calendar-dropdown-portal"
                  className={styles.calendarDropdown}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(dateRef).top,
                    left: getDropdownPosition(dateRef).left,
                    width: 'auto',
                    maxWidth: windowWidth < 768 ? '300px' : '300px',
                    transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                    zIndex: 9999
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
            <button type="submit" className={styles.searchButton}>
              <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              Search Events
            </button>
          </div>
        </div>
        
        {/* Categories Section */}
        <div className={styles.categoriesSection}>
          <h4 className={styles.categoriesTitle}>
            Categories
            {formValues.categories.length > 0 && (
              <span className={styles.selectedCount}>{formValues.categories.length} selected</span>
            )}
          </h4>
          <div className={styles.categoriesContainer}>
            {eventCategories.map(category => (
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
      
      <div className={styles.contentArea}>
        {/* Your main content will go here */}
      </div>
    </div>
  );
};

export default FormSearch;