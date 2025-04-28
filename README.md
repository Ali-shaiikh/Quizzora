# Quizzora

Quizzora is an innovative educational platform that automatically generates quizzes from video content using AI. Upload any educational video, and Quizzora will create engaging quizzes to test and reinforce learning.

## 🌟 Features

- **Video to Quiz Conversion**: Automatically generate quizzes from educational videos
- **AI-Powered Analysis**: Advanced AI processing of video content
- **Interactive Quiz Interface**: User-friendly quiz-taking experience
- **Summary Generation**: Get concise summaries of video content
- **Modern UI**: Beautiful and responsive design using React and Tailwind CSS

## 🏗️ Project Structure

```
Quizzora/
├── quizzora/           # Frontend (React)
│   ├── src/           # React source files
│   ├── public/        # Public assets
│   └── ...
│
└── quizzora-backend/  # Backend (Python/FastAPI)
    ├── main.py        # Main application file
    └── requirements.txt
```

## 🚀 Getting Started

### Frontend Setup

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

1. Navigate to the frontend directory:
```bash
cd quizzora
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

### Available Scripts

In the frontend directory, you can run:

#### `npm start` or `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test` or `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build` or `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd quizzora-backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router
- Axios

### Backend
- Python
- FastAPI
- LangChain
- ChromaDB
- Whisper AI

## 🔐 Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key
```

## 📚 Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Advanced Topics

- [Code Splitting](https://facebook.github.io/create-react-app/docs/code-splitting)
- [Analyzing the Bundle Size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)
- [Making a Progressive Web App](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)
- [Advanced Configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)
- [Deployment](https://facebook.github.io/create-react-app/docs/deployment)
- [Troubleshooting](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- Ali Shaikh - Developer
- Ayush Nayak - Developer
- Sanket Nandurkar - Developer
