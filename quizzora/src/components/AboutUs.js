import React, { useState } from 'react';
import alice from '../assets/alice.jpg';
import bob from '../assets/bob.jpg';
import charlie from '../assets/charlie.jpg';
import diana from '../assets/diana.jpg';

const teamMembers = [
  {
    name: 'Alice Johnson',
    role: 'Co-Founder & CEO',
    image: alice,
    description: 'Alice is an ed-tech enthusiast with a passion for AI-driven learning solutions. She has led multiple AI-driven projects and believes in revolutionizing education with technology.',
  },
  {
    name: 'Bob Smith',
    role: 'CTO',
    image: bob,
    description: 'Bob is a full-stack developer focused on scalable and efficient learning platforms. He specializes in backend development and cloud computing.',
  },
  {
    name: 'Charlie Davis',
    role: 'Lead Designer',
    image: charlie,
    description: 'Charlie crafts intuitive UI/UX to enhance user engagement in learning applications. He ensures every design aligns with accessibility and user-friendly principles.',
  },
  {
    name: 'Diana Patel',
    role: 'AI Researcher',
    image: diana,
    description: 'Diana specializes in AI algorithms to personalize and optimize learning experiences. Her research focuses on adaptive learning models to make education interactive and dynamic.',
  },
];

const AboutUs = () => {
  const [hoveredMember, setHoveredMember] = useState(null);

  return (
    <section className="py-16 bg-white" id="about-us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:space-x-12">
          {/* Team Members Grid */}
          <div className="lg:w-1/2">
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-lg p-1">
              <div className="bg-white rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer"
                      onMouseEnter={() => setHoveredMember(member)}
                      onMouseLeave={() => setHoveredMember(null)}
                    >
                      {/* Team Member Image */}
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-40 object-cover rounded-lg transform transition-all duration-500 group-hover:scale-110"
                      />
                      {/* Hover Effect for Introduction */}
                      <div
                        className={`absolute inset-0 bg-black/60 backdrop-blur-md text-white p-4 flex flex-col justify-center items-center text-center rounded-lg transition-all duration-500 ${
                          hoveredMember === member ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                      >
                        <h3 className="text-lg font-bold">{member.name}</h3>
                        <p className="text-sm text-gray-200">{member.role}</p>
                        <p className="mt-2 text-xs opacity-90">{member.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-10 lg:mt-0 lg:w-1/2">
            <h2 className="text-3xl font-bold text-secondary">About Us</h2>
            <p className="mt-4 text-lg text-gray-600">
              The four students on the left are passionate about solving real challenges faced by learners. Each of them
              is dedicated to bringing unique innovations to education, leveraging technology to enhance learning
              experiences. Their vision is to break traditional barriers and create smarter, more effective solutions
              that empower students worldwide.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
