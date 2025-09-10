import { useState } from 'react';
import axios from 'axios';
import logo from "./assets/logo.png";
import './App.css';

const templates = {
  "00100-Invitation to Bid": {
    file: "00100-Invitation_To_Bid.docx",
    fields: [
      "project_name", "project_description", "owner_name", "street_1", "city_1", "state_1", "zip_1",
      "owner_phone", "owner_email", "date_1", "time_1",
      "engineer_name", "street_2", "city_2", "state_2", "zip_2",
      "engineer_phone", "engineer_email", "date_2", "time_2",
      "prebid_location", "street_3", "city_3", "state_3", "zip_3"
    ]
  },
  "00200-Instruction to Bidders": {
    file: "00200-Instruction_To_Bidders.docx",
    fields: [
      "project_name", "project_description", "owner_name", "street_1", "city_1", "state_1", "zip_1",
      "owner_phone", "owner_email", "date_1", "time_1",
      "engineer_name", "address_2", "city_2", "state_2", "zip_2",
      "engineer_phone", "engineer_email"
    ]
  },
  "01210-General Conditions": {
    file: "01210-General_Conditions.docx",
    fields: [
      "project_name", "completion_days", "starting_hour", "ending_hour"
    ]
  },
  "01010-Summary of Work": {
    file: "01010-Summary_of_Work.docx",
    fields: [
      "project_name", "address_1", "city_1", "state_1", "zip_1",
      "owner_name", "address_2", "city_2", "state_2", "zip_2",
      "owner_number", "owner_email", "date_3"
    ]
  },
  "00011-Table of Contents": {
    file: "00011-Table_of_Contents.docx",
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

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState("00100-Invitation to Bid");
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [formData, setFormData] = useState({});
  const [scopeItems, setScopeItems] = useState([""]);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const correctPassword = "BillerReinhart"; // Change as needed

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
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
    for (const key of template.fields) {
      data.append(key, formData[key] || "");
    }

    if (selectedTemplate === "01010-Summary of Work") {
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
      link.setAttribute('download', `${selectedTemplate}.docx`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Axios Error:", err);
      alert("Failed to generate document");
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
        {selectedTemplate === "01010-Summary of Work" && (
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

  if (!authenticated) {
    return (
    //   <div className="password-screen">
    //     <h2>Enter Password to Access Document Generator</h2>
    //     <form onSubmit={handlePasswordSubmit}>
    //       <input
    //         type="password"
    //         value={passwordInput}
    //         onChange={(e) => setPasswordInput(e.target.value)}
    //         placeholder="Enter password"
    //         required
    //       />
    //       <button type="submit">Unlock</button>
    //     </form>
    //   </div>
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1>Engineering Doc Generator</h1>
        <p>Enter password to access the application</p>
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="login-input-group">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          
          
          <button 
            type="submit" 
            className="login-btn"
          >
            Access Application
          </button>
        </form>
      </div>
    </div>
    );
  }

  return (
    <div>
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className='header-text'>Engineering Doc Generator</h1>
        <h2>Important: Please close this tab when not in use to conserve server resources</h2>
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