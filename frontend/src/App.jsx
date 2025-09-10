import { useState, useEffect } from 'react';
import axios from 'axios';
import logo from "./assets/logo.png";
import './App.css';

const templates = {
  "Invitation to Bid": {
    file: "Invitation_To_Bid.docx",
    fields: [
      "project_name", "project_description", "owner_name", "street_1", "city_1", "state_1", "zip_1",
      "owner_phone", "owner_email", "date_1", "time_1",
      "engineer_name", "street_2", "city_2", "state_2", "zip_2",
      "engineer_phone", "engineer_email", "date_2", "time_2",
      "prebid_location", "street_3", "city_3", "state_3", "zip_3"
    ]
  },
  "Instruction to Bidders": {
    file: "Instruction_To_Bidders.docx",
    fields: [
      "project_name", "project_description", "owner_name", "street_1", "city_1", "state_1", "zip_1",
      "owner_phone", "owner_email", "date_1", "time_1",
      "engineer_name", "address_2", "city_2", "state_2", "zip_2",
      "engineer_phone", "engineer_email"
    ]
  },
  "General Conditions": {
    file: "General_Conditions.docx",
    fields: [
      "project_name", "completion_days", "starting_hour", "ending_hour"
    ]
  },
  "Summary of Work": {
    file: "Summary_of_Work.docx",
    fields: [
      "project_name", "address_1", "city_1", "state_1", "zip_1",
      "owner_name", "address_2", "city_2", "state_2", "zip_2",
      "owner_number", "owner_email", "date_3"
    ]
  }, 
  "Table of Contents": {
    file: "Table_of_Contents.docx",
    fields: [
        "project_name", "invitation_page_num", "instructions_page_num",
        "tabulation_page_num", "summary_page_num", "conditions_page_num"
    ]
  }
};

const engineers = {
    "Natalia Hernandez": {
      engineer_name: "Natalia Hernandez",
      engineer_email: "natalia.hernandez@billerreinhart.com",
      engineer_phone: "813-555-1234"
    },
    "Brian Walter": {
      engineer_name: "Brian Walter",
      engineer_email: "brian.walter@billerreinhart.com",
      engineer_phone: "813-555-5678"
    },
    "Mariela Abreu": {
      engineer_name: "Mariela Abreu",
      engineer_email: "mariela.abreu@billerreinhart.com",
      engineer_phone: "813-555-9999"
    }
};

// Login Component
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send password to backend for verification
      const response = await axios.post('/login', { password });
      if (response.data.success) {
        // Store authentication token in memory
        onLogin(response.data.token);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Invalid password');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Engineering Doc Generator</h1>
        <p>Enter password to access the application</p>
        
        <form onSubmit={handleLogin}>
          <div className="login-input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Access Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("Invitation to Bid");
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [formData, setFormData] = useState({});
  const [scopeItems, setScopeItems] = useState([""]);

  // Check if user is already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    // Store in session storage (cleared when browser closes)
    sessionStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    sessionStorage.removeItem('authToken');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleScopeItemChange = (index, value) => {
    const newItems = [...scopeItems];
    newItems[index] = value;
    setScopeItems(newItems);
  };

  const addScopeItem = () => {
    setScopeItems([...scopeItems, ""]);
  };

  const handleEngineerChange = (e) => {
    const engineerKey = e.target.value;
    setSelectedEngineer(engineerKey);
    const engineerData = engineers[engineerKey];
    if (engineerData) {
      setFormData((prev) => ({
        ...prev,
        ...engineerData
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    const template = templates[selectedTemplate];
    data.append("template_name", template.file);
    
    // Add auth token to request
    data.append("auth_token", authToken);
    
    for (const key of template.fields) {
      data.append(key, formData[key] || "");
    }

    if (selectedTemplate === "Summary of Work") {
      const bullets = scopeItems
        .filter(item => item.trim() !== "")
        .map(item => `• ${item}`)
        .join('\n');
      data.append("project_scope_items", bullets);
    }

    try {
      const response = await axios.post('/generate', data, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customized.docx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Error:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        handleLogout();
      } else {
        alert("Failed to generate document");
      }
    }
  };

  const renderFields = () => {
    const template = templates[selectedTemplate];
    return (
      <>
        {template.fields.map((key) => (
          <div key={key} className="input-group">
            <label htmlFor={key}>{key.replace(/_/g, ' ')}</label>
            <input
              id={key}
              name={key}
              value={formData[key] || ""}
              placeholder={key.replace(/_/g, ' ')}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        {selectedTemplate === "Summary of Work" && (
          <div className="input-group">
            <label>Project Scope Items</label>
            {scopeItems.map((item, index) => (
              <input
                key={index}
                value={item}
                onChange={(e) => handleScopeItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                required
              />
            ))}
            <button type="button" onClick={addScopeItem} className="add-scope-btn">+ Add Scope Item</button>
          </div>
        )}
      </>
    );
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show main app if authenticated
  return (
    <div>
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className='header-text'>Engineering Doc Generator</h1>
        
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        <h3>Choose Your Document:</h3>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {Object.keys(templates).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <h3 style={{ marginTop: "1rem" }}>Choose Engineer:</h3>
        <select
          value={selectedEngineer}
          onChange={handleEngineerChange}
        >
          <option value="">-- Select Engineer --</option>
          {Object.keys(engineers).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <h3>Inputs:</h3>
        {renderFields()}
        <div className="button-container">
          <button type="submit" className="generate_btn">Generate Document</button>
        </div>
      </form>
    </div>
  );
}

export default App;