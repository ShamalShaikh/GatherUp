'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

// hooks
import useAlert from '@hooks/useAlert';

// components
import Input from '@components/Form/Input';
import Button from '@components/Button/Button';
import Loader from '@components/Loader/Loader';
import ButtonLink from '@components/Button/ButtonLink';

// utils
import Request, { type IRequest, type IResponse } from '@utils/Request';
import CategoryButton from '../../signup/components/CategoryButton';
import styles from '../../signup/components/CategoryButton.module.css';

// interfaces
interface IProps {
  data: {
    username: string;
    fullname: string;
    email: string;
    city: string;
    preferences: string[];
  };
}

interface IFormProps {
  username: string;
  fullname: string;
  email: string;
  city: string;
  preferences?: string[];
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
  { icon: 'music_note', text: 'Music' },
  { icon: 'theater_comedy', text: 'Theatre' },
  { icon: 'help', text: 'Undefined' },
  { icon: 'question_mark', text: 'Unknown' },
];

const FormMain: React.FC<IProps> = ({ data }) => {
  const { showAlert, hideAlert } = useAlert();
  const [loading, setLoading] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<IFormProps>({
    username: '',
    fullname: '',
    email: '',
    city: '',
    preferences: [],
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      const userJson = localStorage.getItem('user');

      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          console.log('Loaded user data:', userData);

          // Set initial form values
          setFormValues({
            username: userData.username || '',
            fullname: userData.fullname || userData.full_name || '',
            email: userData.email || '',
            city: userData.location || '',
          });

          // Fetch preferences from the API
          const response = await fetch('http://127.0.0.1:8080/getPreferences', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: userData.username }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Fetched preferences:', result.data);

            // Update preferences in formValues
            setFormValues((prev) => ({
              ...prev,
              preferences: result.data || [], // Use the fetched preferences
            }));
          } else {
            console.error('Failed to fetch preferences:', response.statusText);
          }
        } catch (error) {
          console.error('Error loading user data or fetching preferences:', error);
        }
      } else {
        console.log('No user data found in localStorage');
      }
    };

    fetchPreferences();
  }, []);
  /**
   * Handles the change event for input fields in the form.
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
   * Handles the form submission event.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<any>}
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<any> => {
    e.preventDefault();

    hideAlert();

    setLoading(true);

    const parameters: IRequest = {
      url: 'v1/signin/password',
      method: 'POST',
      postData: {
        email: '',
        password: '',
      },
    };

    const req: IResponse = await Request.getResponse(parameters);

    const { status, data } = req;

    if (status === 200) {
      //
    } else {
      showAlert({ type: 'error', text: data.title ?? '' });
    }

    setLoading(false);
  };

  if (loading) {
    return <Loader type='inline' color='gray' text='Hang on a second' />;
  }

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
            <div className='label-line flex flex-v-center flex-space-between'>
              <label htmlFor='email'>E-mail address</label>
              <Link href='/members/email' className='blue'>
                Change e-mail
              </Link>
            </div>
            <Input
              type='email'
              name='email'
              value={formValues.email}
              maxLength={128}
              placeholder='Enter your e-mail address'
              required
              disabled
              onChange={() => {}}
            />
          </div>
        </div>
        <div className='form-line'>
          <div className='label-line flex flex-v-center flex-space-between'>
            <label htmlFor='password'>Password</label>
            <Link href='/members/password' className='blue'>
              Change password
            </Link>
          </div>
          <Input
            type='password'
            name='password'
            value='dummypassword'
            maxLength={64}
            placeholder='Enter your password'
            required
            disabled
          />
        </div>
        <div className='form-line'>
          <div className='one-line'>
            <div className='label-line'>
              <label htmlFor='city'>City</label>
            </div>
            <Input
              type='text'
              name='city'
              value={formValues.city}
              maxLength={64}
              placeholder='Enter your city'
              required
              onChange={handleChange}
            />
          </div>
        </div>
        <div className='form-line'>
          <label htmlFor='preferences'>Preferences</label>
          <div className='form-categories'>
            <div className={styles.buttonContainer}>
              {eventCategories.map((category) => (
                <CategoryButton
                  key={category.text}
                  icon={category.icon}
                  text={category.text}
                  isSelected={formValues.preferences?.includes(category.text) ?? false} // Highlight if in preferences
                  onClick={() => {}} // No-op to disable interaction
                />
              ))}
            </div>
          </div>
        </div>
        <div className='form-buttons'>
          <ButtonLink color='gray-overlay' text='Sign out' url='members/signout' />
          &nbsp; &nbsp;
          <Button type='submit' color='blue-filled' text='Update profile' />
        </div>
      </div>
    </form>
  );
};

export default FormMain;
