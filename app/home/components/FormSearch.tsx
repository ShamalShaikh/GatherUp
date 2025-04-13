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
}

const FormSearch: React.FC = () => {
  const { showAlert } = useAlert();
  const [isMounted, setIsMounted] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  const [formValues, setFormValues] = useState<IFormProps>({
    keyword: '',
    location: 'Any Location',
    date: null,
  });

  const locations = ['Any Location', 'New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'];
  
  // Refs for dropdown containers
  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  
  // Set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const handleLocationSelect = (location: string): void => {
    setFormValues({ ...formValues, location });
    setShowLocationDropdown(false);
  };

  const handleDateSelect = (date: Date): void => {
    setFormValues({ ...formValues, date });
    setShowDatePicker(false);
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
    console.log('Search values:', formValues);

    const { keyword } = formValues;

    if (keyword === '' || keyword.length < 3) {
      showAlert({ type: 'error', text: 'Please enter minimum 3 characters for search.' });
    }
  };

  // Function to get dropdown position
  const getDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { top: 0, left: 0, width: 0 };
    
    const rect = ref.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    };
  };

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
              >
                <span>{formValues.location}</span>
                <span className="material-symbols-outlined">
                  {showLocationDropdown ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
              
              {isMounted && showLocationDropdown && createPortal(
                <div 
                  className={styles.dropdownMenu}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(locationRef).top,
                    left: getDropdownPosition(locationRef).left,
                    width: getDropdownPosition(locationRef).width
                  }}
                >
                  {locations.map(location => (
                    <div 
                      key={location}
                      className={styles.dropdownItem}
                      onClick={() => handleLocationSelect(location)}
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
              >
                <span>{formValues.date ? format(formValues.date, 'MMM dd, yyyy') : 'Select Date'}</span>
                <span className="material-symbols-outlined">calendar_month</span>
              </button>
              
              {isMounted && showDatePicker && createPortal(
                <div 
                  className={styles.dropdownMenu}
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition(dateRef).top,
                    left: getDropdownPosition(dateRef).left,
                    width: getDropdownPosition(dateRef).width
                  }}
                >
                  <input 
                    type="date" 
                    className={styles.datePicker}
                    onChange={(e) => handleDateSelect(new Date(e.target.value))}
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
      </form>
      
      <div className={styles.contentArea}>
        {/* Your main content will go here */}
      </div>
    </div>
  );
};

export default FormSearch;
