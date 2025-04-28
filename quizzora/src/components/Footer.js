import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Quizzora</h3>
            <p className="text-gray-300 mt-1">AI-powered learning assistant</p>
          </div>
          
          <div className="flex space-x-8">
            <div>
              <h4 className="font-medium mb-2">Quick Links</h4>
              <ul className="space-y-1">
                <li><a href="#features" className="text-gray-300 hover:text-white">Features</a></li>
                <li><a href="#how-to-start" className="text-gray-300 hover:text-white">How to Start</a></li>
                <li><a href="#about-us" className="text-gray-300 hover:text-white">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Contact</h4>
              <ul className="space-y-1">
                <li><a href="mailto:info@quizzora.com" className="text-gray-300 hover:text-white">Quizzora.apsit.edu.in</a></li>
                <li><span className="text-gray-300">+91 9977867567</span></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300 text-sm">
          <p>&copy; {new Date().getFullYear()} Quizzora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;