import React from 'react';

const HowToStart = () => {
  const steps = [
    {
      number: '01',
      title: 'Paste or Upload',
      description: 'Add your content by pasting a YouTube link or uploading a PDF, audio, or video file.'
    },
    {
      number: '02',
      title: 'Generate Summary',
      description: 'Our AI will analyze your content and create a concise summary of the key points.'
    },
    {
      number: '03',
      title: 'Create Quiz',
      description: 'Generate an interactive quiz based on the summary to test your understanding.'
    },
    {
      number: '04',
      title: 'Save & Review',
      description: 'Save both the summary and quiz for later review and continuous learning.'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50" id="how-to-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary">How to Start</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with Quizzora in just a few simple steps
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300"
            >
              <div className="absolute -top-3 -left-3 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-secondary mt-4 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowToStart;