'use client';

import { useState } from 'react';

import Link from 'next/link';

// hooks
import useAlert from '@hooks/useAlert';

// components
import Input from '@components/Form/Input';
import Switch from '@components/Form/Switch';
import Button from '@components/Button/Button';
import Loader from '@components/Loader/Loader';
import CategoryButton from '@components/../app/members/signup/components/CategoryButton';
// import styles from '@components/../app/members/signup/components/CategoryButton.module.css';
import styles from './CategoryButton.module.css';

// utils
import Request, { type IRequest, type IResponse } from '@utils/Request';

// interfaces
interface IFormProps {
  tos: boolean;
  username: string;
  fullname: string;
  email: string;
  password: string;
  location: string;
  preferences: string[];
}

const Form: React.FC = () => {
  const { showAlert, hideAlert } = useAlert();

  const [loading, setLoading] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<IFormProps>({
    username: '',
    fullname: '',
    email: '',
    password: '',
    tos: false,
    location: '',
    preferences: [],
  });

  const handleCategoryToggle = (category: string): void => {
    setFormValues((prev) => {
      const updatedPreferences = prev.preferences.includes(category)
        ? prev.preferences.filter((pref) => pref !== category) // Remove if already selected
        : [...prev.preferences, category]; // Add if not selected

      return {
        ...prev,
        preferences: updatedPreferences, // Update preferences in formValues
      };
    });
  };

  /**
   * Handles the change event for input fields in the form.
   *
   * This function is called when the value of an input field in the form changes. It updates the state of the form values with the new value.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  /**
   * Handles the change event for checkbox fields in the form.
   *
   * This function is called when the value of a checkbox field in the form changes. It updates the state of the form values with the new value.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;

    setFormValues({
      ...formValues,
      [name]: checked,
    });
  };

  /**
   * Handles the form submission event.
   *
   * This function is called when the form is submitted. It prevents the default form submission behavior,
   * hides any existing alert, sets the loading state to true, sends a POST request to the signin/password endpoint,
   * and handles the response. If the response status is 200, it redirects the user to the account activation page.
   * If the status is not 200, it shows an error alert. Finally, it sets the loading state back to false.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<any>} A promise that resolves when the request is complete.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<any> => {
    e.preventDefault();

    if (!formValues.location) {
      showAlert({ type: 'error', text: 'Please select a city before proceeding.' });
      return;
    }

    hideAlert();

    setLoading(true);

    const parameters: IRequest = {
      url: 'register',
      method: 'POST',
      postData: {
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
        full_name: formValues.fullname,
        location: formValues.location,
        preferences: formValues.preferences,
      },
    };

    const req: IResponse = await Request.getResponse(parameters);

    const { status, data } = req;

    if (status === 201) {
      // Store JWT token and user data
      if (data.results?.token) {
        localStorage.setItem('token', data.results.token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            username: formValues.username,
            email: formValues.email,
            fullname: formValues.fullname,
            password: formValues.password,
            location: formValues.location,
            isLoggedIn: true,
            // Add any other user data returned from the API
            ...(data.results?.user || {}),
          })
        );

        // Redirect to home page
        window.location.href = '/';
      } else {
        showAlert({ type: 'error', text: 'Authentication token missing' });
      }
    } else {
      showAlert({ type: 'error', text: data.title ?? 'Error in Sign Up' });
    }

    setLoading(false);
  };

  if (loading) {
    return <Loader type='inline' color='gray' text='Hang on a second' />;
  }

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
    { icon: 'question_mark', text: 'Unknown' },
  ];

  const cities = [
    { text: 'New York' },
    { text: 'Los Angeles' },
    { text: 'Chicago' },
    { text: 'Austin' },
    { text: 'San Francisco' },
    { text: 'Seattle' },
    { text: 'Miami' },
    { text: 'Denver' },
    { text: 'Boston' },
    { text: 'Atlanta' },
  ];

  return (
    <form
      className='form shrink'
      noValidate
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <div className='form-elements'>
        <div className='form-line'>
          <div className='one-line'>
            <button type='button' className='google-button'>
              <svg
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                width='18px'
                height='18px'
                viewBox='0 0 48 48'
              >
                <g>
                  <path
                    fill='#EA4335'
                    d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                  />
                  <path
                    fill='#4285F4'
                    d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                  />
                  <path
                    fill='#34A853'
                    d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                  />
                  <path fill='none' d='M0 0h48v48H0z' />
                </g>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>
        </div>
        <div className='or-line'>
          <hr />
          <span>OR</span>
        </div>
        <div className='form-line'>
          <div className='one-line'>
            <div className='label-line'>
              <label htmlFor='username'>Username</label>
            </div>
            <Input
              type='text'
              name='username'
              value={formValues.username}
              maxLength={64}
              placeholder='Enter your username'
              required
              onChange={handleChange}
            />
          </div>
        </div>
        <div className='form-line'>
          <div className='one-line'>
            <div className='label-line'>
              <label htmlFor='fullname'>Full name</label>
            </div>
            <Input
              type='text'
              name='fullname'
              value={formValues.fullname}
              maxLength={64}
              placeholder='Enter your full name'
              required
              onChange={handleChange}
            />
          </div>
        </div>
        <div className='form-line'>
          <div className='one-line'>
            <div className='label-line'>
              <label htmlFor='email'>E-mail address</label>
            </div>
            <Input
              type='email'
              name='email'
              value={formValues.email}
              maxLength={128}
              placeholder='Enter your e-mail address'
              required
              onChange={handleChange}
            />
          </div>
        </div>
        <div className='form-line'>
          <div className='label-line'>
            <label htmlFor='password'>Password</label>
          </div>
          <Input
            type='password'
            name='password'
            value={formValues.password}
            maxLength={64}
            placeholder='Enter your password'
            required
            onChange={handleChange}
          />
        </div>
        <div className='form-line'>
          <div className='label-line'>
            <label htmlFor='location'>Select your city</label>
          </div>
          <select
            name='location'
            value={formValues.location}
            onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
            required
            className='dropdown'
          >
            <option value='' disabled>
              -- Select a city --
            </option>
            {cities.map((city) => (
              <option key={city.text} value={city.text}>
                {city.text}
              </option>
            ))}
          </select>
        </div>
        <div className='form-line'>
          <div className='label-line'>
            <label htmlFor='categories'>Choose your preference(s)</label>
          </div>
          <div className='form-categories'>
            <div className={styles.buttonContainer}>
              {eventCategories.map((category) => (
                <CategoryButton
                  key={category.text}
                  icon={category.icon}
                  text={category.text}
                  isSelected={formValues.preferences.includes(category.text)}
                  onClick={() => handleCategoryToggle(category.text)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className='form-line'>
          <div className='label-line'>
            <label htmlFor='tos'>Agreements</label>
          </div>
          <Switch name='tos' color='blue' onChange={handleCheckboxChange}>
            I agree to the{' '}
            <Link href='/legal/privacy-policy' className='blue'>
              Privacy policy
            </Link>{' '}
            and{' '}
            <Link href='/legal/terms-of-service' className='blue'>
              TOS
            </Link>
          </Switch>
        </div>
        {/* <div className='form-line'>
          <div className='label-line'>
            <label htmlFor='categories'>
              Choose your preference(s)
              {selectedCategories.length > 0 && (
                <span className={styles.selectedCount}>{selectedCategories.length} selected</span>
              )}
            </label>
          </div>
          <div className='form-categories'>
            <div className='categories-container'>
              {eventCategories.map((category) => (
                <CategoryButton
                  key={category.text}
                  icon={category.icon}
                  text={category.text}
                  isSelected={selectedCategories.includes(category.text)}
                  onClick={() => handleCategoryToggle(category.text)}
                />
              ))}
            </div>
          </div>
        </div> */}

        <div className='form-buttons'>
          <Button type='submit' color='blue-filled' text='Sign up' />
        </div>
      </div>
    </form>
  );
};

export default Form;
