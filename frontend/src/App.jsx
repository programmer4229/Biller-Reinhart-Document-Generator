"use client"

import { useState } from "react"
import axios from "axios"
import logo from "./assets/logo.png"
import "./App.css"

const templates = {
  "Invitation to Bid": {
    file: "Invitation_To_Bid.docx",
    fields: [
      "project_name",
      "project_description",
      "owner_name",
      "street_1",
      "city_1",
      "state_1",
      "zip_1",
      "owner_phone",
      "owner_email",
      "date_1",
      "time_1",
      "engineer_name",
      "street_2",
      "city_2",
      "state_2",
      "zip_2",
      "engineer_phone",
      "engineer_email",
      "date_2",
      "time_2",
      "prebid_location",
      "street_3",
      "city_3",
      "state_3",
      "zip_3",
    ],
  },
  "Instruction to Bidders": {
    file: "Instruction_To_Bidders.docx",
    fields: [
      "project_name",
      "project_description",
      "owner_name",
      "street_1",
      "city_1",
      "state_1",
      "zip_1",
      "owner_phone",
      "owner_email",
      "date_1",
      "time_1",
      "engineer_name",
      "address_2",
      "city_2",
      "state_2",
      "zip_2",
      "engineer_phone",
      "engineer_email",
    ],
  },
  "General Conditions": {
    file: "General_Conditions.docx",
    fields: ["project_name", "completion_days", "starting_hour", "ending_hour"],
  },
  "Summary of Work": {
    file: "Summary_of_Work.docx",
    fields: [
      "project_name",
      "address_1",
      "city_1",
      "state_1",
      "zip_1",
      "owner_name",
      "address_2",
      "city_2",
      "state_2",
      "zip_2",
      "owner_number",
      "owner_email",
      "date_3",
      // Note: project_scope_items handled separately
    ],
  },
}

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState("Invitation to Bid")
  const [formData, setFormData] = useState({})
  const [scopeItems, setScopeItems] = useState([""])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleScopeItemChange = (index, value) => {
    const newItems = [...scopeItems]
    newItems[index] = value
    setScopeItems(newItems)
  }

  const addScopeItem = () => {
    setScopeItems([...scopeItems, ""])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    const template = templates[selectedTemplate]
    data.append("template_name", template.file)
    for (const key of template.fields) {
      data.append(key, formData[key] || "")
    }

    // If using Summary of Work, join scope items
    if (selectedTemplate === "Summary of Work") {
      const bullets = scopeItems
        .filter((item) => item.trim() !== "")
        .map((item) => `• ${item}`)
        .join("\n")
      data.append("project_scope_items", bullets)
    }

    try {
      const response = await axios.post("http://localhost:5050/generate", data, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "customized.docx")
      document.body.appendChild(link)
      link.click()
    } catch (err) {
      console.error("❌ Axios Error:", err)
      alert("Failed to generate document")
    }
  }

  const renderFields = () => {
    const template = templates[selectedTemplate]

    const projectFields = template.fields.filter(
      (field) =>
        field.includes("project_") ||
        field === "completion_days" ||
        field === "starting_hour" ||
        field === "ending_hour",
    )

    const ownerFields = template.fields.filter(
      (field) =>
        field.includes("owner_") || (field.includes("_1") && !field.includes("date_1") && !field.includes("time_1")),
    )

    const engineerFields = template.fields.filter(
      (field) => field.includes("engineer_") || field.includes("_2") || field.includes("address_2"),
    )

    const dateTimeFields = template.fields.filter((field) => field.includes("date_") || field.includes("time_"))

    const locationFields = template.fields.filter((field) => field.includes("prebid_location") || field.includes("_3"))

    const otherFields = template.fields.filter(
      (field) =>
        !projectFields.includes(field) &&
        !ownerFields.includes(field) &&
        !engineerFields.includes(field) &&
        !dateTimeFields.includes(field) &&
        !locationFields.includes(field),
    )

    return (
      <>
        {projectFields.length > 0 && (
          <div className="form-section">
            <h4>Project Information</h4>
            <div className="form-grid">
              {projectFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input id={key} name={key} placeholder={key.replace(/_/g, " ")} onChange={handleChange} required />
                </div>
              ))}
            </div>
          </div>
        )}

        {ownerFields.length > 0 && (
          <div className="form-section">
            <h4>Owner Information</h4>
            <div className="form-grid">
              {ownerFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input id={key} name={key} placeholder={key.replace(/_/g, " ")} onChange={handleChange} required />
                </div>
              ))}
            </div>
          </div>
        )}

        {engineerFields.length > 0 && (
          <div className="form-section">
            <h4>Engineer Information</h4>
            <div className="form-grid">
              {engineerFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input id={key} name={key} placeholder={key.replace(/_/g, " ")} onChange={handleChange} required />
                </div>
              ))}
            </div>
          </div>
        )}

        {dateTimeFields.length > 0 && (
          <div className="form-section">
            <h4>Schedule Information</h4>
            <div className="form-grid">
              {dateTimeFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input
                    id={key}
                    name={key}
                    type={key.includes("date") ? "date" : key.includes("time") ? "time" : "text"}
                    placeholder={key.replace(/_/g, " ")}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {locationFields.length > 0 && (
          <div className="form-section">
            <h4>Location Information</h4>
            <div className="form-grid">
              {locationFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input id={key} name={key} placeholder={key.replace(/_/g, " ")} onChange={handleChange} required />
                </div>
              ))}
            </div>
          </div>
        )}

        {otherFields.length > 0 && (
          <div className="form-section">
            <h4>Additional Information</h4>
            <div className="form-grid">
              {otherFields.map((key) => (
                <div key={key} className="input-group">
                  <label htmlFor={key}>{key.replace(/_/g, " ")}</label>
                  <input id={key} name={key} placeholder={key.replace(/_/g, " ")} onChange={handleChange} required />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTemplate === "Summary of Work" && (
          <div className="form-section">
            <h4>Project Scope</h4>
            <div className="scope-section">
              <label>Project Scope Items</label>
              {scopeItems.map((item, index) => (
                <div key={index} className="scope-item">
                  <input
                    value={item}
                    onChange={(e) => handleScopeItemChange(index, e.target.value)}
                    placeholder={`Scope item ${index + 1}`}
                    required
                  />
                </div>
              ))}
              <button type="button" className="add-scope-btn" onClick={addScopeItem}>
                + Add Another Scope Item
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div>
      <div className="header">
        <img src={logo || "/placeholder.svg"} alt="Logo" className="logo" />
        <h1 className="header-text">Engineering Doc Generator</h1>
        <h3>Choose Your Document:</h3>
        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
          {Object.keys(templates).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <h3>Inputs:</h3>
        {renderFields()}
        <div className="button-container">
          <button type="submit" className="generate_btn">
            Generate Document
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
