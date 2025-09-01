# MeitY Audit Mobile App

A **full-stack mobile application** built with **React Native (Expo)** and a **Django backend**.  
Its purpose is to digitize and streamline the process of submitting, managing, and reviewing **security audit requests** for government-mandated systems.  
The application serves as a collaborative platform for multiple user roles, from service providers to government officials.

---

## 🚀 Features

- **Multi-Role User System** (4 roles):
  - **CSP (Cloud Service Provider):** Submits new audit requests & uploads required documents.
  - **STQC Auditor:** Reviews submitted documents, conducts audits & provides feedback.
  - **MeitY Reviewer:** Reviews audit reports & can approve/reject requests.
  - **Scientist F:** Final authority to issue a digital certificate after audit completion.

- **Secure Document Management:** Upload, view & manage audit-related documents.
- **Dynamic Workflow:** UI & actions change based on user role and request status.
- **Intuitive UI:** Clean and user-friendly design to simplify complex processes.
- **State Management:** Uses **React Context** for smooth global state handling.

---

## 📱 Quick Start with Expo Snack

You can run this app instantly without setup:

1. Open: [Expo Snack Demo](https://expo.dev/preview/update?message=meity+mobile+application+using+react+native&updateRuntimeVersion=1.0.0&createdAt=2025-07-31T09%3A32%3A57.423Z&slug=exp&projectId=437f8c40-4b25-4194-8e4b-3e5e3caf84a2&group=0c03d4cb-f9d3-438e-97df-b59b6b8c3737)  
2. Scan the QR code using **Expo Go** app on your phone.  
3. The app will load and be ready to use!

---

## ⚙️ Prerequisites

Before running locally, ensure you have:

- [Node.js (LTS)](https://nodejs.org/)
- npm or Yarn
- Expo CLI:  
  ```bash
  npm install -g expo-cli
