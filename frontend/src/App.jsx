// App.jsx
import { useState } from 'react';
import axios from 'axios';
import logo from "./assets/logo.png";
import './App.css';

const templates = {
  "Invitation to Bid": {
    file: "Invitation_To_Bid.docx",
    fields: [
      "project_name", "owner_name", "street_1", "city_1", "state_1", "zip_1",
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
      "project_name"
    ]
  }
};

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState("Invitation to Bid");
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("template_name", templates[selectedTemplate].file);
    for (const key of templates[selectedTemplate].fields) {
      data.append(key, formData[key] || "");
    }

    try {
        const response = await axios.post('http://localhost:5050/generate', data, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customized.docx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Axios Error:", err);
      alert("Failed to generate document");
    }
  };

  return (
    <div>
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className='header-text'>Engineering Doc Generator</h1>
        <h3>Choose Your Document:</h3>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {Object.keys(templates).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <h3>Inputs:</h3>
        {templates[selectedTemplate].fields.map((key) => (
          <div key={key} className="input-group">
            <label htmlFor={key}>{key.replace(/_/g, ' ')}</label>
            <input
              id={key}
              name={key}
              placeholder={key.replace(/_/g, ' ')}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <div className="button-container">
          <button type="submit" className="generate_btn">Generate Document</button>
        </div>
      </form>
    </div>
  );
}

export default App;
