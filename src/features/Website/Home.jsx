import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import './Home.css';

/**
 * Home page component
 */
const Home = () => {
  const [expandedBlog, setExpandedBlog] = useState(null);

  const blogPosts = [
    {
      id: 1,
      title: "Understanding HIV: Essential Facts Everyone Should Know",
      author: "Dr. Sarah Chen",
      date: "2024-01-15",
      excerpt: "HIV (Human Immunodeficiency Virus) affects millions worldwide, but with proper knowledge and treatment, people with HIV can live long, healthy lives.",
      content: "HIV (Human Immunodeficiency Virus) affects millions worldwide, but with proper knowledge and treatment, people with HIV can live long, healthy lives. HIV attacks the body's immune system, specifically CD4 cells (T cells), which help the immune system fight off infections. Without treatment, HIV can destroy so many CD4 cells that the body can't fight off infections and disease. The virus is transmitted through specific body fluids including blood, semen, vaginal and rectal fluids, and breast milk. However, HIV cannot survive long outside the human body, and it cannot be transmitted through casual contact, saliva, or mosquito bites. Early diagnosis and treatment are crucial for maintaining health and preventing transmission to others."
    },
    {
      id: 2,
      title: "The Importance of Regular HIV Testing",
      author: "Dr. Michael Rodriguez",
      date: "2024-01-20",
      excerpt: "Regular HIV testing is a critical component of preventive healthcare. Early detection allows for timely treatment and better health outcomes.",
      content: "Regular HIV testing is a critical component of preventive healthcare. Early detection allows for timely treatment and better health outcomes. The CDC recommends that everyone between ages 13-64 get tested at least once as part of routine healthcare, with more frequent testing for those at higher risk. Modern HIV tests are highly accurate and can detect the virus within 10-33 days after exposure. There are several types of tests available: rapid tests that provide results in 20 minutes, home testing kits, and laboratory tests. Testing is confidential and often free at many healthcare facilities. Remember, knowing your status empowers you to make informed decisions about your health and helps protect your partners."
    },
    {
      id: 3,
      title: "Living Well with HIV: A Comprehensive Guide",
      author: "Dr. Jennifer Park",
      date: "2024-01-25",
      excerpt: "With modern treatment, people with HIV can live full, productive lives. This guide covers essential aspects of managing HIV and maintaining overall health.",
      content: "With modern treatment, people with HIV can live full, productive lives. This guide covers essential aspects of managing HIV and maintaining overall health. The key to living well with HIV is consistent medical care, adherence to antiretroviral therapy (ART), and maintaining a healthy lifestyle. Regular monitoring of viral load and CD4 count helps healthcare providers adjust treatment as needed. Beyond medical treatment, mental health support, proper nutrition, regular exercise, and stress management are crucial. Building a support network of family, friends, and healthcare providers creates a strong foundation for long-term health. Many people with HIV work, have families, and pursue their goals just like anyone else. With proper treatment, the virus can become undetectable, meaning it cannot be transmitted to sexual partners (U=U: Undetectable = Untransmittable)."
    },
    {
      id: 4,
      title: "Antiretroviral Therapy (ART): Your Path to Health",
      author: "Dr. David Kim",
      date: "2024-02-01",
      excerpt: "Antiretroviral therapy has revolutionized HIV treatment. Learn about how ART works, its benefits, and what to expect when starting treatment.",
      content: "Antiretroviral therapy has revolutionized HIV treatment. Learn about how ART works, its benefits, and what to expect when starting treatment. ART involves taking a combination of HIV medicines daily to prevent the virus from multiplying. These medications work by blocking different stages of the HIV life cycle. Modern ART regimens are highly effective, often reducing viral load to undetectable levels within 3-6 months. The current standard involves taking 1-3 pills daily, with some single-tablet regimens available. Common side effects are generally mild and manageable, including nausea, fatigue, or headaches, which often improve over time. The benefits of ART extend beyond personal health – achieving an undetectable viral load prevents transmission to sexual partners. Starting ART early, regardless of CD4 count, is now recommended for all people diagnosed with HIV."
    },
    {
      id: 5,
      title: "HIV Prevention: Protecting Yourself and Others",
      author: "Dr. Lisa Thompson",
      date: "2024-02-05",
      excerpt: "Prevention remains our strongest tool against HIV. Explore effective prevention strategies including PrEP, safe practices, and education.",
      content: "Prevention remains our strongest tool against HIV. Explore effective prevention strategies including PrEP, safe practices, and education. Pre-exposure prophylaxis (PrEP) is a highly effective prevention method for people at high risk, reducing transmission risk by up to 99% when taken consistently. Consistent and correct condom use provides significant protection during sexual activity. For people who inject drugs, using clean needles and accessing needle exchange programs are crucial prevention strategies. Post-exposure prophylaxis (PEP) can prevent HIV infection if started within 72 hours after potential exposure. Education and open communication about HIV status between partners also play vital roles in prevention. Remember, people with HIV who maintain an undetectable viral load through treatment cannot transmit the virus sexually (U=U principle)."
    },
    {
      id: 6,
      title: "Nutrition and HIV: Fueling Your Body for Optimal Health",
      author: "Dr. Amanda Foster",
      date: "2024-02-10",
      excerpt: "Proper nutrition plays a crucial role in HIV management. Discover how the right foods can support your immune system and overall well-being.",
      content: "Proper nutrition plays a crucial role in HIV management. Discover how the right foods can support your immune system and overall well-being. A well-balanced diet helps maintain a strong immune system, supports the effectiveness of HIV medications, and promotes overall health. Focus on consuming adequate protein to maintain muscle mass, as HIV and some medications can affect protein metabolism. Include plenty of fruits and vegetables rich in antioxidants, vitamins, and minerals. Whole grains provide sustained energy and important B vitamins. Healthy fats from sources like nuts, seeds, and olive oil support nutrient absorption and heart health. Stay hydrated and limit processed foods high in sugar and sodium. Some HIV medications may interact with certain foods or supplements, so always consult with your healthcare provider about dietary considerations. Working with a registered dietitian can help create a personalized nutrition plan that supports your health goals."
    },
    {
      id: 7,
      title: "Mental Health and HIV: Supporting Your Emotional Well-being",
      author: "Dr. Robert Martinez",
      date: "2024-02-15",
      excerpt: "Living with HIV can impact mental health. Learn about resources and strategies to maintain emotional well-being throughout your journey.",
      content: "Living with HIV can impact mental health. Learn about resources and strategies to maintain emotional well-being throughout your journey. It's normal to experience a range of emotions after an HIV diagnosis, including fear, anger, or sadness. These feelings are valid and addressing them is an important part of comprehensive HIV care. Mental health support can include counseling, support groups, and sometimes medication for depression or anxiety. Building a strong support network of family, friends, and healthcare providers is crucial. Many people find peer support groups particularly helpful, as they provide connection with others who understand similar experiences. Stress management techniques like meditation, yoga, or regular exercise can improve both mental and physical health. Don't hesitate to seek professional help if you're struggling with depression, anxiety, or other mental health concerns. Remember, taking care of your mental health is just as important as managing your physical health."
    },
    {
      id: 8,
      title: "Advances in HIV Treatment: What's New in 2024",
      author: "Dr. Patricia Williams",
      date: "2024-02-20",
      excerpt: "HIV treatment continues to evolve with new medications and approaches. Stay informed about the latest developments in HIV care.",
      content: "HIV treatment continues to evolve with new medications and approaches. Stay informed about the latest developments in HIV care. Recent advances include new single-tablet regimens that combine multiple medications into one daily pill, reducing pill burden and improving convenience. Long-acting injectable medications administered every month or two are now available, offering an alternative to daily pills. These options can significantly improve quality of life for people who prefer fewer daily medications. Research continues into HIV cure strategies, including 'shock and kill' approaches and gene therapy. New medications with improved side effect profiles and resistance barriers are in development. Additionally, treatment as prevention (TasP) has been validated – people with undetectable viral loads cannot transmit HIV sexually. Telemedicine and digital health tools are making HIV care more accessible. Regular communication with your healthcare provider ensures you can benefit from these advances as they become available."
    }
  ];

  const toggleBlogExpansion = (blogId) => {
    setExpandedBlog(expandedBlog === blogId ? null : blogId);
  };

  return (
    <div className="home-container">
      <Navbar />
      
      {/* Introduction Section */}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">HIV Clinic Appointment System</h1>
              <h2 className="hero-subtitle">Comprehensive HIV Care & Treatment</h2>
              <p className="hero-description">
                Welcome to our specialized HIV clinic offering comprehensive care, treatment, and support.
                We provide confidential HIV testing, antiretroviral therapy, counseling services, and
                ongoing medical support to help you live a healthy, fulfilling life.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Book Appointment
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Patient Portal
                </Link>
              </div>
            </div>
            
            <div className="hero-image">
              <div className="hero-placeholder">
                <div className="medical-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3>Trusted HIV Care</h3>
                <p>Professional, confidential, compassionate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div className="about-section">
        <div className="container">
          <h2 className="section-title">About Our HIV Clinic</h2>
          
          <div className="about-content">
            <div className="about-text">
              <div className="about-mission">
                <h3>Our Mission</h3>
                <p>
                  Our HIV clinic is dedicated to providing comprehensive, compassionate, and
                  confidential care for individuals living with HIV. We believe that with proper
                  treatment and support, people with HIV can live long, healthy, and productive lives.
                </p>
              </div>

              <div className="about-services">
                <h3>Our Services</h3>
                <div className="services-grid">
                  <div className="service-item">
                    <h4>HIV Testing & Diagnosis</h4>
                    <p>Confidential rapid and standard HIV testing with pre- and post-test counseling</p>
                  </div>
                  <div className="service-item">
                    <h4>Antiretroviral Therapy (ART)</h4>
                    <p>Comprehensive HIV treatment with the latest medications and monitoring</p>
                  </div>
                  <div className="service-item">
                    <h4>Medical Monitoring</h4>
                    <p>Regular CD4 count and viral load monitoring to track treatment progress</p>
                  </div>
                  <div className="service-item">
                    <h4>Counseling & Support</h4>
                    <p>Mental health support, peer counseling, and support group facilitation</p>
                  </div>
                  <div className="service-item">
                    <h4>Prevention Services</h4>
                    <p>PrEP consultation, safer sex counseling, and harm reduction strategies</p>
                  </div>
                  <div className="service-item">
                    <h4>Specialized Care</h4>
                    <p>Treatment for opportunistic infections and HIV-related complications</p>
                  </div>
                </div>
              </div>

              <div className="about-credentials">
                <h3>Our Approach</h3>
                <p>
                  Our multidisciplinary team includes board-certified infectious disease specialists,
                  HIV-experienced nurses, counselors, and support staff. We follow evidence-based
                  treatment guidelines and provide individualized care plans. Our clinic maintains
                  strict confidentiality standards and creates a welcoming, non-judgmental environment
                  for all patients.
                </p>
              </div>

              <div className="about-contact">
                <h3>Contact Information</h3>
                <div className="contact-grid">
                  <div className="contact-item">
                    <h4>Address</h4>
                    <p>123 Health Center Drive<br/>Medical District, Bangkok 10330</p>
                  </div>
                  <div className="contact-item">
                    <h4>Phone</h4>
                    <p>+66 (2) 123-4567<br/>24/7 Emergency: +66 (2) 123-4568</p>
                  </div>
                  <div className="contact-item">
                    <h4>Hours</h4>
                    <p>Mon-Fri: 8:00 AM - 6:00 PM<br/>Sat: 9:00 AM - 2:00 PM</p>
                  </div>
                  <div className="contact-item">
                    <h4>Email</h4>
                    <p>appointments@hivclinic.com<br/>info@hivclinic.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blogs Section */}
      <div className="blogs-section">
        <div className="container">
          <h2 className="section-title">HIV Health & Wellness Blog</h2>
          <p className="blogs-subtitle">
            Stay informed with the latest information about HIV treatment, prevention, and living well with HIV
          </p>
          
          <div className="blogs-grid">
            {blogPosts.map(blog => (
              <div key={blog.id} className="blog-card">
                <div className="blog-header">
                  <h3 className="blog-title">{blog.title}</h3>
                  <div className="blog-meta">
                    <span className="blog-author">By {blog.author}</span>
                    <span className="blog-date">{new Date(blog.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
                
                <div className="blog-content">
                  <p className="blog-excerpt">
                    {expandedBlog === blog.id ? blog.content : blog.excerpt}
                  </p>
                  
                  <button
                    className="blog-toggle"
                    onClick={() => toggleBlogExpansion(blog.id)}
                  >
                    {expandedBlog === blog.id ? 'Read Less' : 'Read More'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;