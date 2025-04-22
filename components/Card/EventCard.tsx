import Link from 'next/link';

// components
import Badge from '@components/Badge/Badge';
import ButtonLink from '@components/Button/ButtonLink';

// interfaces
interface IProps {
  url: string;
  when: string;
  name: string;
  venue: string;
  image: string;
  color: string;
  external?: boolean;
}

const EventCard: React.FC<IProps> = ({ url, when, name, venue, image, color, external = false }) => (
  <div className='card'>
    <div className='card-title'>
      <h3>{name}</h3>
    </div>
    <div
      className='card-image'
      style={{
        backgroundImage: `url("${image}")`,
      }}
    >
      <Badge color={color} text='NEW' />
    </div>
    <div className='card-info'>
      <p>
        <span className='material-symbols-outlined'>event</span> {when}
      </p>
      <p>
        <span className='material-symbols-outlined'>apartment</span> {venue}
      </p>
    </div>
    <div className='card-buttons'>
      {external ? (
        <ButtonLink
          color={`${color}-overlay`}
          text='Get Tickets'
          rightIcon='open_in_new'
          url={url}
          target="_blank"
        />
      ) : (
        <ButtonLink
          color={`${color}-overlay`}
          text='Details'
          rightIcon='arrow_forward'
          url={`/event/${url}`}
        />
      )}
    </div>
  </div>
);

export default EventCard;
