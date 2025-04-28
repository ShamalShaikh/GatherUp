'use client';

import { type Metadata } from 'next';

// components
import Master from '@components/Layout/Master';
import Section from '@components/Section/Section';
import Heading from '@components/Heading/Heading';
import ButtonLink from '@components/Button/ButtonLink';

const Page: React.FC = () => (
  <Master>
    <Section className='white-background'>
      <div className='container'>
        <div className='padding-bottom center'>
          <Heading type={1} color='gray' text='Meet Our Legendary Team' />
          <p className='gray form-information'>
            The ones who make the magic happen. If Hogwarts had a tech department, we'd all be expelled for turning laptops into kittens.
          </p>
        </div>
      </div>
    </Section>
    
    <Section className='gray-background'>
      <div className='container'>
        <div className='center'>
          <Heading type={5} color='blue' text='The Founders' />
          <div className='team-member'>
            <img src="https://picsum.photos/200/200?random=1" alt="CEO" className="team-photo" />
            <h3 className='team-name'>Shamal "The Boss" Shaikh</h3>
            <p className='team-title'>Chief Everything Officer</p>
            <p className='gray team-bio'>
              Legend says he once debugged an entire codebase using only psychic powers and coffee. His Patronus is a stackoverflow answer with 10k upvotes. <em>"I'm not saying I'm Batman, but have you ever seen me and Batman coding in the same room?"</em>
            </p>
            <div className='team-socials'>
              <ButtonLink color='blue-overlay' text='LinkedIn' rightIcon='link' url='https://linkedin.com' target="_blank" />
              <ButtonLink color='gray-overlay' text='GitHub' rightIcon='code' url='https://github.com' target="_blank" />
            </div>
          </div>
          
          <div className='team-member'>
            <img src="https://picsum.photos/200/200?random=2" alt="CTO" className="team-photo" />
            <h3 className='team-name'>Rachel "The Code Whisperer" Green</h3>
            <p className='team-title'>Chief Technical Officer</p>
            <p className='gray team-bio'>
              Spends more time with APIs than with people. Has been known to debate the merits of tabs vs. spaces for 3 hours straight. <em>"Could this code BE any more efficient?"</em>
            </p>
            <div className='team-socials'>
              <ButtonLink color='blue-overlay' text='LinkedIn' rightIcon='link' url='https://linkedin.com' target="_blank" />
              <ButtonLink color='gray-overlay' text='GitHub' rightIcon='code' url='https://github.com' target="_blank" />
            </div>
          </div>
        </div>
      </div>
    </Section>
    
    <Section className='white-background'>
      <div className='container'>
        <div className='center'>
          <Heading type={5} color='red' text='The Development Wizards' />
          
          <div className='team-grid'>
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=3" alt="Frontend Developer" className="team-photo" />
              <h3 className='team-name'>Chandler "The Sarcasm" Bing</h3>
              <p className='team-title'>Frontend Sorcerer</p>
              <p className='gray team-bio'>
                Writes CSS like Shakespeare wrote sonnets. Can make a button so beautiful you'll cry. <em>"I'm not great at advice. Can I interest you in a sarcastic comment about your UI design?"</em>
              </p>
            </div>
            
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=4" alt="Backend Developer" className="team-photo" />
              <h3 className='team-name'>Dwight "The Database" Schrute</h3>
              <p className='team-title'>Backend Mastermind</p>
              <p className='gray team-bio'>
                Farms beets and servers with equal passion. Fact: Bears eat beets. Bears. Beets. Backend-Galactica. <em>"I am faster than 80% of all databases. That's why my nickname was 'Query Boy'."</em>
              </p>
            </div>
            
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=5" alt="Full Stack Developer" className="team-photo" />
              <h3 className='team-name'>Sheldon "The Algorithm" Cooper</h3>
              <p className='team-title'>Full Stack Physicist</p>
              <p className='gray team-bio'>
                Has a dedicated spot on the server rack. Knocks three times before pushing to production. <em>"I'm not crazy. My mother had me tested. My code, on the other hand..."</em>
              </p>
            </div>
            
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=6" alt="UX Designer" className="team-photo" />
              <h3 className='team-name'>Luna "The Dreamer" Lovegood</h3>
              <p className='team-title'>UX Design Visionary</p>
              <p className='gray team-bio'>
                Sees user interfaces others can't. Believes in the existence of both Nargles and good mobile experiences. <em>"You're just as sane as I am if you think this design works."</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
    
    <Section className='gray-background'>
      <div className='container'>
        <div className='center'>
          <Heading type={5} color='purple' text='Quality Assurance & Support' />
          
          <div className='team-grid'>
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=7" alt="QA Engineer" className="team-photo" />
              <h3 className='team-name'>Ron "Try-It-And-See" Weasley</h3>
              <p className='team-title'>QA Specialist</p>
              <p className='gray team-bio'>
                Professional bug hunter. Terrified of spider(web) sites. <em>"Why is it when something breaks, it's always you three: JavaScript, CSS, and HTML?"</em>
              </p>
            </div>
            
            <div className='team-member'>
              <img src="https://picsum.photos/200/200?random=8" alt="Customer Support" className="team-photo" />
              <h3 className='team-name'>Phoebe "The Quirky" Buffay</h3>
              <p className='team-title'>Customer Happiness Manager</p>
              <p className='gray team-bio'>
                Has a song for every error code. Her support emails are bizarrely effective. <em>"🎵 Smelly code, smelly code, what are they teaching you? Smelly code, smelly code, it's not your fault! 🎵"</em>
              </p>
            </div>
          </div>
          
          <div className='padding-top'>
            <h3>Join Our Team of Misfits!</h3>
            <p className='gray'>
              We're always looking for new wizards, muggles, and everything in between to join our chaotic adventure.
              No time-turners needed, but ability to laugh at terrible code puns is mandatory.
            </p>
            <div className='button-container padding-top'>
              <ButtonLink color='purple-filled' text='Apply Now (Maybe?)' rightIcon='work' url='https://youtu.be/dQw4w9WgXcQ' target="_blank" />
            </div>
          </div>
        </div>
      </div>
    </Section>
    
    <Section className='white-background'>
      <div className='container'>
        <div className='center'>
          <Heading type={5} color='green' text='Page Member Details' />
          
          <div className='team-grid'>
            <div className='team-member page-member'>
              <img src="https://picsum.photos/200/200?random=9" alt="Page Owner" className="team-photo" />
              <h3 className='team-name'>Shamal Shaikh</h3>
              <p className='team-title'>Senior Technical Lead</p>
              <p className='gray team-bio'>
                <strong>Email:</strong> shamal.shaikh@gatherup.com<br />
                <strong>Department:</strong> Engineering<br />
                <strong>Specialization:</strong> Frontend Architecture<br />
                <strong>Office Hours:</strong> Mon-Fri, 9am-5pm PST
              </p>
              <div className='team-socials'>
                <ButtonLink color='green-overlay' text='Email' rightIcon='email' url='mailto:shamal.shaikh@gatherup.com' target="_blank" />
                <ButtonLink color='gray-overlay' text='Schedule Meeting' rightIcon='event_available' url='#' target="_blank" />
              </div>
            </div>
            
            <div className='team-member page-member'>
              <img src="https://picsum.photos/200/200?random=10" alt="Assistant Page Owner" className="team-photo" />
              <h3 className='team-name'>Alex Rivera</h3>
              <p className='team-title'>Technical Product Manager</p>
              <p className='gray team-bio'>
                <strong>Email:</strong> alex.rivera@gatherup.com<br />
                <strong>Department:</strong> Product<br />
                <strong>Specialization:</strong> User Experience<br />
                <strong>Office Hours:</strong> Mon-Fri, 10am-6pm EST
              </p>
              <div className='team-socials'>
                <ButtonLink color='green-overlay' text='Email' rightIcon='email' url='mailto:alex.rivera@gatherup.com' target="_blank" />
                <ButtonLink color='gray-overlay' text='Schedule Meeting' rightIcon='event_available' url='#' target="_blank" />
              </div>
            </div>
          </div>
          
          <div className='padding-top'>
            <h3>Need Help With This Page?</h3>
            <p className='gray'>
              If you encounter any issues with this page or have suggestions for improvement,
              please reach out to our page members listed above. They are responsible for maintaining
              and enhancing this part of the application.
            </p>
          </div>
        </div>
      </div>
    </Section>
    
    <style jsx>{`
      .team-member {
        margin: 2rem auto;
        max-width: 500px;
        padding: 1.5rem;
        background-color: white;
        border-radius: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease;
      }
      
      .team-member:hover {
        transform: translateY(-5px);
      }
      
      .page-member {
        border-left: 4px solid #22c55e;
      }
      
      .team-photo {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #f0f0f0;
        margin-bottom: 1rem;
      }
      
      .team-name {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: #333;
      }
      
      .team-title {
        font-size: 1rem;
        color: #3b82f6;
        margin-bottom: 1rem;
        font-weight: 500;
      }
      
      .team-bio {
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      
      .team-socials {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 1rem;
      }
      
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }
      
      @media (max-width: 768px) {
        .team-grid {
          grid-template-columns: 1fr;
        }
      }
      
      .padding-top {
        padding-top: 3rem;
      }
    `}</style>
  </Master>
);

export default Page;
