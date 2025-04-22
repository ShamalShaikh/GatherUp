'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Input from '@components/Form/Input';
import { format } from 'date-fns';
import styles from './FormSearch.module.css';

// hooks
import useAlert from '@hooks/useAlert';

// utils
import Request, { type IRequest, type IResponse } from '@utils/Request';

// interfaces
interface IFormProps {
  name: string;
  state: string;
  city: string;
  date: Date | null;
  categories: string[];
}

interface IEventResult {
  _id: string;
  name: string;
  date_time: string;
  image_url: string;
  descriptions?: string;
  venue: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  classifications: {
    segment: string;
    genre: string;
    subGenre?: string;
  };
  price_range?: {
    min: number | null;
    max: number | null;
    currency: string | null;
  };
  sources: {
    ticketmaster?: {
      ticket_availability: string;
      url: string;
    };
  };
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
          aria-label={`${monthNames[month]} ${i}, ${year}`}
          aria-selected={isSelected ? "true" : "false"}
          tabIndex={isFocused ? 0 : -1}
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
  { icon: 'music_note', text: 'Alternative' },
  { icon: 'theater_comedy', text: 'Comedy' },
  { icon: 'nightlife', text: 'Dance/Electronic' },
  { icon: 'keyboard_voice', text: 'Hip-Hop/Rap' },
  { icon: 'electric_bolt', text: 'Metal' },
  { icon: 'diversity_3', text: 'Miscellaneous' },
  { icon: 'category', text: 'Other' },
  { icon: 'emoji_people', text: 'Performance Art' },
  { icon: 'music_note', text: 'Pop' },
  { icon: 'theater_comedy', text: 'Theatre' },
  { icon: 'help', text: 'Undefined' },
  { icon: 'question_mark', text: 'Unknown' }
];

// Function to format ISO date to readable format
const formatEventDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return 'Date not available';
    }
    return format(date, 'MMM dd, yyyy - h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date not available';
  }
};

const FormSearch: React.FC = () => {
  const { showAlert, hideAlert } = useAlert();
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<IEventResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const [formValues, setFormValues] = useState<IFormProps>({
    name: '',
    state: 'Any State',
    city: 'Any City',
    date: null,
    categories: [],
  });

  const states = ['Any State', 'CA', 'NY', 'TX', 'FL', 'IL'];
  const cities = ['Any City', 'Los Angeles', 'New York', 'Chicago', 'Miami', 'Seattle', 'Dallas', 'San Francisco'];
  
  // Refs for dropdown containers
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  
  // Set mounted state for client-side rendering and track window width
  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    const handleScroll = () => {
      // Force update of dropdown positions when scrolling
      if (showStateDropdown || showCityDropdown || showDatePicker) {
        setForceUpdate(prev => prev + 1);
      }
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showStateDropdown, showCityDropdown, showDatePicker]);
  
  // Function to get dropdown position
  const getDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { top: 0, left: 0, width: 0 };
    
    const rect = ref.current.getBoundingClientRect();
    
    // For mobile view, position centered but below the button
    if (windowWidth < 768) {
      return {
        top: rect.bottom + 5, // Add a small gap
        left: windowWidth / 2,
        transform: 'translateX(-50%)',
        width: Math.min(300, windowWidth * 0.9),
        maxWidth: Math.min(300, windowWidth * 0.9)
      };
    }
    
    // For desktop view, position below the button
    return {
      top: rect.bottom + 5, // Add a small gap
      left: rect.left,
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
        setShowStateDropdown(false);
        setShowCityDropdown(false);
        setShowDatePicker(false);
        break;
      default:
        break;
    }
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside the dropdown portal
        const stateDropdownElement = document.getElementById('state-dropdown-portal');
        if (stateDropdownElement && stateDropdownElement.contains(event.target as Node)) {
          return;
        }
        setShowStateDropdown(false);
      }
      
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside the dropdown portal
        const cityDropdownElement = document.getElementById('city-dropdown-portal');
        if (cityDropdownElement && cityDropdownElement.contains(event.target as Node)) {
          return;
        }
        setShowCityDropdown(false);
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
        setShowStateDropdown(false);
        setShowCityDropdown(false);
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

  const [focusedStateIndex, setFocusedStateIndex] = useState<number>(-1);
  const [focusedCityIndex, setFocusedCityIndex] = useState<number>(-1);

  const handleStateSelect = (state: string): void => {
    setFormValues({ ...formValues, state });
    setShowStateDropdown(false);
  };

  const handleCitySelect = (city: string): void => {
    setFormValues({ ...formValues, city });
    setShowCityDropdown(false);
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
   * Prevents the default form submission behavior, validates inputs,
   * and sends the form data to the backend filterEvents API.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The event object from the form submission.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const { name, state, city, date, categories } = formValues;
    
    // Validate search input
    if (name === '' && categories.length === 0 && state === 'Any State' && city === 'Any City' && date === null) {
      showAlert({ 
        type: 'error', 
        text: 'Please enter minimum 3 characters for search or select at least one category.' 
      });
      return;
    }
    
    // Set to null if "Any" values are selected
    const stateParam = state === 'Any State' ? null : state;
    const cityParam = city === 'Any City' ? null : city;
    
    // Format the request data
    const requestData = {
      name: name.trim() || '',
      state: stateParam || '',
      city: cityParam || '',
      date: date ? format(date, 'yyyy-MM-dd') : '',
      categories: categories.length > 0 ? categories : []
    };
    
    // Log the search parameters
    console.log('Sending search parameters to API:', requestData);
    
    // Reset search state
    setSearchResults([]);
    setHasSearched(true);
    
    try {
      // Prepare request parameters
      const parameters: IRequest = {
        url: 'searchEvents',
        method: 'POST',
        postData: requestData
      };
      
      // Show loading state
      setIsLoading(true);
      
      // Send request to API
      const response: IResponse = await Request.getResponse(parameters);
      
      // Hide loading state
      setIsLoading(false);
      
      // Handle response
      if (response.status === 200) {
        // Success - handle the response data structure safely
        let results: IEventResult[] = [];
        
        // Use type assertion to handle the response data
        const responseData = response.data as any;
        
        if (responseData) {
          if (Array.isArray(responseData.data)) {
            results = responseData.data;
          } else if (Array.isArray(responseData.results)) {
            results = responseData.results;
          } else if (Array.isArray(responseData)) {
            results = responseData;
          }
        }
        
        setSearchResults(results);
        
        // Show success message for 1 second
        showAlert({
          type: 'success',
          text: `Found ${results.length} events matching your criteria`
        });
        
        // Auto-dismiss the success message after 1 second
        setTimeout(() => {
          hideAlert();
        }, 1000);
      } else {
        // Show error message
        showAlert({
          type: 'error',
          text: response.data.title || 'Failed to filter events. Please try again.'
        });
      }
    } catch (error) {
      // Hide loading state
      setIsLoading(false);
      
      // Show error message
      showAlert({
        type: 'error',
        text: 'An error occurred while connecting to the server. Please try again.'
      });
      
      console.error('Error filtering events:', error);
    }
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
              <div className={styles.inputLabel}>Name</div>
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
            <label className={styles.inputLabel}>Name</label>
            <Input
              type='text'
              name='name'
              value={formValues.name}
              maxLength={64}
              placeholder='Event, venue, artist, name'
              required
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>State</label>
            <div className={styles.dropdownContainer} ref={stateRef}>
              <button 
                type="button"
                className={styles.dropdownButton}
                onClick={() => setShowStateDropdown(!showStateDropdown)}
                aria-haspopup="listbox"
                aria-expanded={showStateDropdown}
                aria-label="Select a state"
              >
                <span>{formValues.state}</span>
                <span className="material-symbols-outlined">
                  {showStateDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted && showStateDropdown && createPortal(
                <div 
                  id="state-dropdown-portal"
                  className={styles.dropdownMenu}
                  role="listbox"
                  tabIndex={-1}
                  aria-activedescendant={focusedStateIndex >= 0 ? `state-option-${focusedStateIndex}` : undefined}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(stateRef).top,
                    left: getDropdownPosition(stateRef).left,
                    width: windowWidth < 768 ? 'auto' : getDropdownPosition(stateRef).width,
                    maxWidth: windowWidth < 768 ? '300px' : getDropdownPosition(stateRef).width,
                    transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                    zIndex: 9999
                  }}
                  onKeyDown={(e) => handleKeyDown(e, states, focusedStateIndex, setFocusedStateIndex, handleStateSelect)}
                  key={`state-dropdown-${forceUpdate}`}
                >
                  {states.map((state, index) => (
                    <div 
                      key={state}
                      id={`state-option-${index}`}
                      className={`${styles.dropdownItem} ${focusedStateIndex === index ? styles.focused : ''}`}
                      onClick={() => handleStateSelect(state)}
                      role="option"
                      aria-selected={formValues.state === state}
                      tabIndex={0}
                      onMouseEnter={() => setFocusedStateIndex(index)}
                      onFocus={() => setFocusedStateIndex(index)}
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
                type="button"
                className={styles.dropdownButton}
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                aria-haspopup="listbox"
                aria-expanded={showCityDropdown}
                aria-label="Select a city"
              >
                <span>{formValues.city}</span>
                <span className="material-symbols-outlined">
                  {showCityDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted && showCityDropdown && createPortal(
                <div 
                  id="city-dropdown-portal"
                  className={styles.dropdownMenu}
                  role="listbox"
                  tabIndex={-1}
                  aria-activedescendant={focusedCityIndex >= 0 ? `city-option-${focusedCityIndex}` : undefined}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(cityRef).top,
                    left: getDropdownPosition(cityRef).left,
                    width: windowWidth < 768 ? 'auto' : getDropdownPosition(cityRef).width,
                    maxWidth: windowWidth < 768 ? '300px' : getDropdownPosition(cityRef).width,
                    transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
                    zIndex: 9999
                  }}
                  onKeyDown={(e) => handleKeyDown(e, cities, focusedCityIndex, setFocusedCityIndex, handleCitySelect)}
                  key={`city-dropdown-${forceUpdate}`}
                >
                  {cities.map((city, index) => (
                    <div 
                      key={city}
                      id={`city-option-${index}`}
                      className={`${styles.dropdownItem} ${focusedCityIndex === index ? styles.focused : ''}`}
                      onClick={() => handleCitySelect(city)}
                      role="option"
                      aria-selected={formValues.city === city}
                      tabIndex={0}
                      onMouseEnter={() => setFocusedCityIndex(index)}
                      onFocus={() => setFocusedCityIndex(index)}
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
                  key={`calendar-dropdown-${forceUpdate}`}
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
              type="submit" 
              className={styles.searchButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={`material-symbols-outlined ${styles.searchIcon}`}>hourglass_empty</span>
                  Searching...
                </>
              ) : (
                <>
                  <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                  Search Events
                </>
              )}
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
        {hasSearched && (
          <div className={styles.resultsContainer}>
            <h3 className={styles.resultsTitle}>
              {searchResults.length > 0 
                ? `Found ${searchResults.length} events` 
                : 'No events found matching your criteria'}
            </h3>
            
            {searchResults.length > 0 && (
              <div className={styles.resultsList}>
                {searchResults.map((event) => (
                  <div key={event._id} className={styles.eventCard}>
                    {event.image_url && (
                      <div className={styles.eventImageContainer}>
                        <img src={event.image_url} alt={event.name} className={styles.eventImage} />
                      </div>
                    )}
                    <div className={styles.eventInfo}>
                      <h4 className={styles.eventTitle}>{event.name}</h4>
                      <div className={styles.eventMetadata}>
                        <span className={styles.eventDate}>
                          <span className="material-symbols-outlined">calendar_today</span>
                          {formatEventDate(event.date_time)}
                        </span>
                        <span className={styles.eventLocation}>
                          <span className="material-symbols-outlined">location_on</span>
                          {event.venue.name}, {event.venue.city}, {event.venue.state}
                        </span>
                        <span className={styles.eventCategory}>
                          <span className="material-symbols-outlined">
                            {/* Map genre to appropriate icon with null checks */}
                            {event.classifications?.genre?.toLowerCase().includes('alternative') ? 'music_note' :
                             event.classifications?.genre?.toLowerCase().includes('comedy') ? 'theater_comedy' :
                             event.classifications?.genre?.toLowerCase().includes('dance') || event.classifications?.genre?.toLowerCase().includes('electronic') ? 'nightlife' :
                             event.classifications?.genre?.toLowerCase().includes('hip-hop') || event.classifications?.genre?.toLowerCase().includes('rap') ? 'keyboard_voice' :
                             event.classifications?.genre?.toLowerCase().includes('metal') ? 'electric_bolt' :
                             event.classifications?.genre?.toLowerCase().includes('miscellaneous') ? 'diversity_3' :
                             event.classifications?.genre?.toLowerCase().includes('performance art') ? 'emoji_people' :
                             event.classifications?.genre?.toLowerCase().includes('pop') ? 'music_note' :
                             event.classifications?.genre?.toLowerCase().includes('theatre') ? 'theater_comedy' :
                             event.classifications?.genre?.toLowerCase().includes('undefined') || event.classifications?.genre?.toLowerCase().includes('unknown') ? 'help' :
                             'event'}
                          </span>
                          {event.classifications?.genre || event.classifications?.segment || 'Uncategorized'}
                          {event.classifications?.subGenre && ` - ${event.classifications.subGenre}`}
                        </span>
                      </div>
                      
                      {/* Price and ticket availability */}
                      <div className={styles.eventActions}>
                        {/* Removing price range information */}
                        
                        {event.sources?.ticketmaster && (
                          <div className={styles.ticketStatus}>
                            <span className={`material-symbols-outlined ${
                              event.sources.ticketmaster.ticket_availability === 'onsale' 
                                ? styles.availableTicket 
                                : styles.unavailableTicket
                            }`}>
                              {event.sources.ticketmaster.ticket_availability === 'onsale' ? 'confirmation_number' : 'do_not_disturb'}
                            </span>
                            {event.sources.ticketmaster.ticket_availability === 'onsale' ? 'Tickets on sale' : 'Currently unavailable'}
                          </div>
                        )}
                        
                        {/* Ticket purchase button */}
                        {event.sources?.ticketmaster?.url && event.sources.ticketmaster.ticket_availability === 'onsale' && (
                          <a 
                            href={event.sources.ticketmaster.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.buyButton}
                          >
                            <span className="material-symbols-outlined">shopping_cart</span>
                            Buy Tickets
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSearch;