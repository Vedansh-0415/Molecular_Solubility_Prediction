# 🧪 Aqueous Solubility Prediction using Machine Learning

<p align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Regression-orange?logo=scikitlearn)
![Flask](https://img.shields.io/badge/Flask-Web%20App-000000?logo=flask)
![Jupyter](https://img.shields.io/badge/Jupyter-Notebook-F37626?logo=jupyter)

</p>

Predicting the **aqueous solubility (logS)** of small molecules using molecular descriptors and classical machine learning algorithms. This project implements an end-to-end regression pipeline using the **Delaney ESOL dataset**, comparing a **Linear Regression** model with a **Random Forest Regressor** — and ships an interactive **Flask web app** for making live predictions and exploring model performance.

---

## 📌 Project Highlights

* Built an end-to-end regression pipeline using Scikit-learn
* Trained and compared **Linear Regression** and **Random Forest Regressor**
* Evaluated model performance using **Mean Squared Error (MSE)** and **R² Score**
* Visualized prediction performance using regression analysis
* Tested **Linear Regression**, **Random Forest**, **Gradient Boosting**, and **Support Vector Regressor**
* Deployed trained models behind a **Flask backend** with a live prediction UI, actual-vs-predicted scatter plot, and a model comparison dashboard
* Added a **SMILES to RDKit to prediction** flow for rapid molecule testing

---

## 🧬 Why Predict Solubility?

Aqueous solubility is one of the most important physicochemical properties in **drug discovery**.

Many promising drug candidates fail because they dissolve poorly in water, reducing their bioavailability. Experimental measurement of solubility is expensive and time-consuming, making computational prediction an important task in **cheminformatics**.

This project reproduces the classical **Delaney (ESOL)** approach by predicting molecular solubility directly from easily computed molecular descriptors.

---

## 📂 Dataset

### Source

The project uses the **Delaney Solubility Dataset**, which contains molecular descriptors and experimentally measured aqueous solubility values (`logS`) for small organic molecules.

### Dataset Summary

| Property            | Value                         |
| ------------------- | ----------------------------- |
| **Samples**         | 1,144 molecules               |
| **Task**            | Regression                    |
| **Target Variable** | **logS (Aqueous Solubility)** |

### Molecular Descriptors Used

| Feature                | Description                         |
| ---------------------- | ----------------------------------- |
| **MolLogP**            | Octanol/Water partition coefficient |
| **MolWt**              | Molecular Weight                    |
| **NumRotatableBonds**  | Number of rotatable bonds           |
| **AromaticProportion** | Fraction of aromatic atoms          |

These descriptors can be calculated directly from molecular structures without laboratory experiments, making them suitable for rapid computational screening.

---

## ⚙️ Machine Learning Workflow

```text
            Molecular Solubility Prediction Pipeline

                     ┌─────────────────────┐
                     │   Load Dataset      │
                     └─────────┬───────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │ Data Preprocessing  │
                     │ • Clean Missing Data│
                     │ • Handle Outliers   │
                     │ • Feature Encoding  │
                     └─────────┬───────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │ Feature Selection   │
                     └─────────┬───────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │ Train-Test Split    │
                     │      (80 : 20)      │
                     └─────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
      ┌───────────────────┐      ┌───────────────────┐
      │ Linear Regression │      │  Random Forest    │
      └─────────┬─────────┘      └─────────┬─────────┘
                │                          │
                └──────────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Model Evaluation    │
                    │ • Mean Squared Error│
                    │ • R² Score          │
                    └─────────┬───────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Best Model Saved    │
                    │ (.pkl using Pickle) │
                    └─────────┬───────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Flask Deployment    │
                    │ Prediction API/UI   │
                    └─────────────────────┘
```

---

## 🌐 Web App

The trained models are served through a Flask backend with a modern, browser-based UI that features:

* **Glassmorphism Design:** A stunning, premium aesthetic featuring translucent panels, glowing neon accents, and interactive hover effects.
* **Animated Background:** A dynamic, drifting background layer that adds depth and movement to the user experience.
* Entering molecular descriptor values and getting a **live logS prediction** from either model.
* Instantly calculating descriptors and predictions from a **SMILES string** using RDKit.
* Toggling between **Linear Regression**, **Random Forest**, and **Gradient Boosting**.
* Viewing an **actual vs. predicted scatter plot** per model.
* Viewing **train/test MSE and R²** for all models, LR coefficients, and tree-based feature importances.

### API Routes

| Route             | Method | Description                                              |
| ----------------- | ------ | ---------------------------------------------------------|
| `/`               | GET    | Renders the main UI                                      |
| `/predict`        | POST   | Takes descriptor values + model choice, returns a logS prediction |
| `/predict/smiles` | POST   | Takes a SMILES string, uses RDKit to compute descriptors, and returns prediction |
| `/scatter`        | GET    | Returns actual vs. predicted points for a given model     |
| `/metrics`        | GET    | Returns metrics, LR coefficients, and feature importances |

### Running the App

```bash
cd app
pip install -r requirements.txt
python app.py
```

The app runs at `http://127.0.0.1:5000/` by default.

---

## 🛠️ Technologies Used

* Python
* Pandas
* NumPy
* Scikit-learn
* RDKit
* Flask
* Matplotlib
* Jupyter Notebook

---

## 📈 Results

| Model                   | Training MSE | Training R² |  Test MSE |   Test R² |
| ----------------------- | -----------: | ----------: | --------: | --------: |
| **Linear Regression**   |    **1.008** |   **0.765** | **1.021** | **0.789** |
| Random Forest Regressor |        1.028 |       0.760 |     1.408 |     0.709 |

### Key Findings

* **Linear Regression achieved the best predictive performance** on both the training and testing datasets.
* The close agreement between training and testing metrics indicates **good generalization** with minimal evidence of overfitting.
* The shallow Random Forest (`max_depth=2`) produced lower predictive performance, demonstrating that **simpler models can outperform more complex models** when the relationship between features and target is approximately linear.

### Conclusion

Linear Regression outperformed the constrained Random Forest model, achieving a **Test R² of 0.789** while maintaining consistent performance on unseen data. The results show that simpler regression models can be highly effective for predicting molecular solubility when using a small set of informative molecular descriptors.

---

## 📁 Repository Structure

```text
Molecular_Solubility_Prediction/
│
├── app/
│   ├── app.py         # Flask app (routes: /, /predict, /scatter, /metrics)
│   ├── requirements.txt
│   ├── model/
│   │   ├── linear_regression_model.pkl
│   │   └── random_forest_model.pkl
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       ├── js/
│       └── img/
│
├── data/
│   └── delaney_solubility_with_descriptors.csv
│
├── notebook/
│   └── solubility.ipynb
│
└── README.md
```

---

## 👨‍💻 Collaborators

- **Debashis Kar** (https://www.linkedin.com/in/debashis-kar-0b033830a)
- **Divyom Srivastava** (https://www.linkedin.com/in/divyom-srivastava-260b95342/)
- **Vedansh Verma** (https://www.linkedin.com/in/vedansh-verma/)

⭐ If you found this project useful, consider giving it a star!
