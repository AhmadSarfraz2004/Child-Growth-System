import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Baby,
  Calculator,
  Calendar,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  History,
  Home,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { apiRequest, getApiBaseUrl } from "./api";
import childPhoto from "./assets/child-login-photo.png";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "children", label: "My Children", icon: Users },
  { id: "add-child", label: "Add Child", icon: Plus },
  { id: "bmi", label: "BMI Analysis", icon: Calculator },
  { id: "prediction", label: "Growth Prediction", icon: Sparkles },
  { id: "history", label: "Growth History", icon: History },
  { id: "profile", label: "Profile", icon: User },
];

const initialPredictionForm = {
  childId: "",
  childName: "",
  age: "",
  gender: "Male",
  height: "",
  weight: "",
  bmi: "",
  meals: "3 Meals",
  fruits_veggies: "Often (4–5 days/week)",
  junk_food: "Rarely",
  protein: "Daily",
  sleep: "8–10 hours",
  activity: "30–60 minutes",
  screen_time: "Less than 1 hour",
  medical: "No",
  waterIntake: "6",
};

const measurementLimits = {
  age: { min: 0, max: 18, label: "Age", unit: "years" },
  height: { min: 40, max: 220, label: "Height", unit: "cm" },
  weight: { min: 2, max: 150, label: "Weight", unit: "kg" },
  bmi: { min: 8, max: 60, label: "BMI", unit: "" },
  waterIntake: { min: 0, max: 20, label: "Water intake", unit: "glasses" },
};

const modelFeatureOptions = {
  meals: ["1-2 Meals", "3 Meals", "4 or more Meals"],
  protein: ["Rarely", "1–2 times/week", "3–4 times/week", "Daily"],
  screen_time: ["Less than 1 hour", "1–2 hours", "3–4 hours", "More than 4 hours"],
  fruits_veggies: [
    "Rarely (0–1 days/week)",
    "Sometimes (2–3 days/week)",
    "Often (4–5 days/week)",
    "Daily (6–7 days/week)",
  ],
  sleep: ["Less than 6 hours", "6–8 hours", "8–10 hours", "More than 10 hours"],
  medical: ["No", "Yes"],
  junk_food: ["Rarely", "1–2 times/week", "3–4 times/week", "Daily"],
  activity: ["Less than 30 minutes", "30–60 minutes", "1–2 hours", "More than 2 hours"],
};

const requiredModelFeatureLabels = {
  childName: "Child name",
  meals: "Meals per day",
  protein: "Milk/Protein intake",
  screen_time: "Screen time",
  fruits_veggies: "Fruit/Veg intake",
  sleep: "Sleep hours",
  medical: "Medical condition",
  junk_food: "Junk food frequency",
  activity: "Physical activity",
};

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return "";
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  return Math.max(years, 0);
}

function calculateBmi(height, weight) {
  const numericHeight = Number(height);
  const numericWeight = Number(weight);

  if (!numericHeight || !numericWeight) {
    return "";
  }

  if (
    numericHeight < measurementLimits.height.min ||
    numericHeight > measurementLimits.height.max ||
    numericWeight < measurementLimits.weight.min ||
    numericWeight > measurementLimits.weight.max
  ) {
    return "";
  }

  const heightInMeters = numericHeight / 100;
  return (numericWeight / (heightInMeters * heightInMeters)).toFixed(1);
}

function getRangeMessage(value, limit) {
  const numericValue = Number(value);

  if (value === "" || Number.isNaN(numericValue)) {
    return `${limit.label} is required.`;
  }

  if (numericValue < limit.min || numericValue > limit.max) {
    return `${limit.label} must be between ${limit.min} and ${limit.max}${limit.unit ? ` ${limit.unit}` : ""}.`;
  }

  return "";
}

function getMeasurementError({ age, height, weight, bmi }, includeAge = true, includeBmi = true) {
  if (includeAge) {
    const ageError = getRangeMessage(age, measurementLimits.age);
    if (ageError) return ageError;
  }

  const heightError = getRangeMessage(height, measurementLimits.height);
  if (heightError) return `${heightError} Use centimeters, for example 110 cm.`;

  const weightError = getRangeMessage(weight, measurementLimits.weight);
  if (weightError) return weightError;

  if (includeBmi) {
    const bmiError = getRangeMessage(bmi, measurementLimits.bmi);
    if (bmiError) return bmiError;

    const expectedBmi = calculateBmi(height, weight);
    if (expectedBmi && Math.abs(Number(bmi) - Number(expectedBmi)) > 0.5) {
      return `BMI should be about ${expectedBmi} for this height and weight.`;
    }
  }

  return "";
}

function getPredictionFormError(form, calculatedBmi) {
  const measurementError = getMeasurementError({ ...form, bmi: calculatedBmi }, true, true);

  if (measurementError) {
    return measurementError;
  }

  for (const [field, label] of Object.entries(requiredModelFeatureLabels)) {
    if (!String(form[field] || "").trim()) {
      return `${label} is required.`;
    }
  }

  for (const [field, options] of Object.entries(modelFeatureOptions)) {
    if (!options.includes(form[field])) {
      return `${requiredModelFeatureLabels[field]} must use one of the available options.`;
    }
  }

  const waterError = getRangeMessage(form.waterIntake, measurementLimits.waterIntake);
  if (waterError) return waterError;

  return "";
}

function getBmiCategory(bmi) {
  const value = Number(bmi);
  if (!value) return "Waiting";
  if (value < 14) return "Underweight";
  if (value <= 18.5) return "Normal";
  return "Needs review";
}

function getStatusClass(status = "") {
  const normalized = status.toLowerCase();
  if (normalized.includes("normal") || normalized.includes("healthy")) return "status-normal";
  if (normalized.includes("above")) return "status-high";
  if (normalized.includes("under")) return "status-low";
  return "status-muted";
}

function buildRecommendations(status = "", bmi = "") {
  const normalizedStatus = status.toLowerCase();
  const bmiCategory = getBmiCategory(bmi);

  if (normalizedStatus.includes("under") || bmiCategory === "Underweight") {
    return {
      headline: "Nutrition and routine support",
      summary: "The result suggests this child may need closer nutrition and growth monitoring.",
      items: [
        {
          title: "Increase nutrient-dense meals",
          text: "Add balanced meals with protein, grains, fruits, vegetables, and healthy fats.",
          icon: HeartPulse,
        },
        {
          title: "Track sleep and activity",
          text: "Keep a weekly log of sleep, active play, screen time, and appetite changes.",
          icon: Activity,
        },
        {
          title: "Consult a pediatrician",
          text: "If low growth continues, review the child history with a qualified doctor.",
          icon: Shield,
        },
      ],
    };
  }

  if (normalizedStatus.includes("above") || bmiCategory === "Needs review") {
    return {
      headline: "Healthy balance plan",
      summary: "The result looks higher than the usual range, so balanced habits matter.",
      items: [
        {
          title: "Review meal portions",
          text: "Keep meals balanced and limit sugary drinks, packaged snacks, and frequent fast food.",
          icon: Calculator,
        },
        {
          title: "Add active play",
          text: "Aim for daily movement through outdoor play, walking, cycling, or sports.",
          icon: Activity,
        },
        {
          title: "Keep monthly records",
          text: "Save height, weight, and BMI regularly so trends are easier to compare.",
          icon: Calendar,
        },
      ],
    };
  }

  return {
    headline: "Keep current healthy habits",
    summary: "The result is in a reassuring range. Continue regular tracking and balanced routines.",
    items: [
      {
        title: "Maintain balanced meals",
        text: "Continue a steady routine with protein, fruits, vegetables, grains, and enough water.",
        icon: HeartPulse,
      },
      {
        title: "Protect sleep time",
        text: "Keep bedtime consistent and reduce screen time close to sleep.",
        icon: Shield,
      },
      {
        title: "Track monthly growth",
        text: "Save a new growth prediction every few weeks to build a reliable history.",
        icon: Calendar,
      },
    ],
  };
}

function ButtonSpinner() {
  return <span className="buttonSpinner" aria-hidden="true" />;
}

function Logo() {
  return (
    <div className="logo">
      <span className="logoMark">
        <Activity size={18} />
      </span>
      <span>Child Growth <strong>Predictor</strong></span>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setMessage("");

    if (mode === "register" && form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };
      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onAuth(data.user, data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authIntro">
        <Logo />
        <img src={childPhoto} alt="Child playing outdoors" className="authImage" />
        <h1>A calmer way to follow your child's growth</h1>
        <p>AI-powered insights, made for parents like you.</p>
        <div className="trustRow">
          <span><CheckCircle2 size={15} /> Easy to use</span>
          <span><Sparkles size={15} /> AI insights</span>
          <span><Shield size={15} /> Secure</span>
        </div>
      </section>

      <section className="authPanel">
        <div className="authTabs" aria-label="Authentication mode">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>
        <h2>{mode === "login" ? "Welcome Back" : "Create Parent Account"}</h2>
        <p>
          {mode === "login"
            ? "Login to continue tracking your child's growth progress."
            : "Start tracking your child's growth journey with personalized AI insights."}
        </p>

        <form onSubmit={submitAuth} className="formStack">
          {mode === "register" && (
            <label>
              Full Name
              <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
            </label>
          )}
          <label>
            Email Address
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
              required
            />
          </label>
          {mode === "register" && (
            <label>
              Confirm Password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateForm("confirmPassword", event.target.value)}
                required
              />
            </label>
          )}
          {message && <p className="formMessage errorText">{message}</p>}
          <button className="primaryButton fullButton" disabled={loading}>
            {loading ? <><ButtonSpinner /> Please wait...</> : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <p className="smallNote">Backend: {getApiBaseUrl()}</p>
      </section>
    </main>
  );
}

function AppShell({ user, activeView, setActiveView, onLogout, children }) {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <Logo />
        <nav className="navList" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "navItem active" : "navItem"}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="logoutButton" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <div className="mainArea">
        <header className="topbar">
          <label className="searchBox">
            <Search size={16} />
            <input placeholder="Search children, records..." aria-label="Search children and records" />
          </label>
          <div className="userBadge">
            <span>{user?.name?.[0]?.toUpperCase() || "P"}</span>
            <div>
              <strong>{user?.name || "Parent"}</strong>
              <small>{user?.role || "parent"}</small>
            </div>
          </div>
        </header>
        <main className="contentArea">{children}</main>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone = "" }) {
  return (
    <article className={`statTile ${tone}`}>
      <span><Icon size={18} /></span>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}

function Dashboard({ childrenList, history, setActiveView }) {
  const latest = history[0];
  const averageBmi =
    history.length > 0
      ? (history.reduce((sum, record) => sum + Number(record.bmi || 0), 0) / history.length).toFixed(1)
      : "0.0";

  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>Dashboard</h1>
          <p>Your at-a-glance overview.</p>
        </div>
        <div className="actionRow">
          <button className="ghostButton" onClick={() => setActiveView("add-child")}>
            <Plus size={16} /> Add Child
          </button>
          <button className="primaryButton" onClick={() => setActiveView("prediction")}>
            <Sparkles size={16} /> Predict
          </button>
        </div>
      </div>

      <section className="welcomeBand">
        <div>
          <h2>Welcome back, Parent</h2>
          <p>Here is a quick overview of your child growth tracking activity.</p>
        </div>
        <button onClick={() => setActiveView("prediction")}>
          <Sparkles size={16} /> Generate Prediction
        </button>
      </section>

      <section className="statGrid">
        <StatTile icon={Baby} label="Total Children" value={childrenList.length} />
        <StatTile icon={HeartPulse} label="Latest Prediction" value={latest?.growthStatus || "No records"} tone="green" />
        <StatTile icon={Calculator} label="Avg BMI" value={history.length ? averageBmi : "No data"} tone="purple" />
        <StatTile icon={Calendar} label="Last Updated" value={latest ? formatDate(latest.createdAt) : "Not yet"} tone="orange" />
      </section>

      <section className="dashboardGrid">
        <article className="panel chartPanel">
          <div className="panelHeader">
            <div>
              <h2>Growth Trend</h2>
              <p>Latest saved AI predictions</p>
            </div>
            <span className="statusPill status-normal">Live</span>
          </div>
          <div className="miniChart" aria-label="BMI trend chart">
            {(history.length ? history.slice(0, 6).reverse() : [{ bmi: 14 }, { bmi: 15 }, { bmi: 16 }]).map((record, index) => (
              <span
                key={`${record._id || "sample"}-${index}`}
                style={{ height: `${Math.max(20, Math.min(92, Number(record.bmi || 14) * 4))}%` }}
                title={`BMI ${record.bmi || "sample"}`}
              />
            ))}
          </div>
        </article>

        <article className="panel insightPanel">
          <div className="iconBubble"><Sparkles size={18} /></div>
          <h2>Recent AI Insight</h2>
          <p>
            {latest
              ? `Latest status is ${latest.growthStatus}. Continue tracking regularly for better long-term insights.`
              : "No prediction yet. Generate the first AI prediction to begin history tracking."}
          </p>
          <button className="linkButton" onClick={() => setActiveView("history")}>View history</button>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Recent Growth Records</h2>
            <p>Latest measurements across all children</p>
          </div>
          <button className="linkButton" onClick={() => setActiveView("history")}>View all</button>
        </div>
        <RecordsTable records={history.slice(0, 5)} />
      </section>
    </section>
  );
}

function ChildrenView({ childrenList, setActiveView, onDeleteChild }) {
  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>My Children</h1>
          <p>View and manage all child profiles from one place.</p>
        </div>
        <button className="primaryButton" onClick={() => setActiveView("add-child")}>
          <Plus size={16} /> Add Child
        </button>
      </div>

      <div className="childGrid">
        {childrenList.map((child) => (
          <article className="childCard" key={child._id}>
            <div className="childAvatar">{child.name?.[0]?.toUpperCase() || "C"}</div>
            <div>
              <h2>{child.name}</h2>
              <p>{calculateAge(child.dateOfBirth)} yrs - {child.gender}</p>
            </div>
            <button className="iconButton danger" title="Delete child" onClick={() => onDeleteChild(child._id)}>
              <Trash2 size={16} />
            </button>
          </article>
        ))}
        {childrenList.length === 0 && (
          <div className="emptyState">
            <Baby size={34} />
            <h2>No children added yet</h2>
            <p>Add a child profile to connect predictions with child history.</p>
            <button className="primaryButton" onClick={() => setActiveView("add-child")}>Add Child</button>
          </div>
        )}
      </div>
    </section>
  );
}

function AddChildView({ onAddChild }) {
  const [form, setForm] = useState({ name: "", gender: "Male", dateOfBirth: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitChild = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await onAddChild(form);
      setForm({ name: "", gender: "Male", dateOfBirth: "" });
      setMessage("Child profile added successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>Add Child Profile</h1>
          <p>Enter your child's information to begin growth tracking.</p>
        </div>
      </div>
      <form className="panel formGrid" onSubmit={submitChild}>
        <label>
          Child Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Gender
          <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label>
          Date of Birth
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
            required
          />
        </label>
        <div className="formActions">
          <button className="primaryButton" disabled={loading}>
            {loading ? <><ButtonSpinner /> Saving...</> : "Save Child"}
          </button>
          {message && <span className={message.includes("success") ? "successText" : "errorText"}>{message}</span>}
        </div>
      </form>
    </section>
  );
}

function BmiView({ predictionForm, setPredictionForm, setActiveView }) {
  const computedBmi = calculateBmi(predictionForm.height, predictionForm.weight);
  const measurementError = getMeasurementError(
    { height: predictionForm.height, weight: predictionForm.weight },
    false,
    false
  );

  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>BMI Analysis</h1>
          <p>Calculate and understand your child's BMI using current growth data.</p>
        </div>
      </div>
      <section className="bmiLayout">
        <div className="panel formGrid">
          <label>
            Height (cm)
            <input
              type="number"
              min={measurementLimits.height.min}
              max={measurementLimits.height.max}
              placeholder="e.g. 110"
              value={predictionForm.height}
              onChange={(event) => setPredictionForm({ ...predictionForm, height: event.target.value, bmi: "" })}
            />
            <small className="fieldHint">Use centimeters, not feet or inches.</small>
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              min={measurementLimits.weight.min}
              max={measurementLimits.weight.max}
              placeholder="e.g. 18"
              value={predictionForm.weight}
              onChange={(event) => setPredictionForm({ ...predictionForm, weight: event.target.value, bmi: "" })}
            />
            <small className="fieldHint">Use kilograms.</small>
          </label>
          <button
            className="primaryButton"
            type="button"
            disabled={Boolean(measurementError)}
            onClick={() => setPredictionForm({ ...predictionForm, bmi: computedBmi })}
          >
            <Calculator size={16} /> Calculate BMI
          </button>
          {measurementError && <p className="formMessage errorText">{measurementError}</p>}
        </div>
        <article className="panel bmiResult">
          <span>BMI</span>
          <strong>{computedBmi || "--"}</strong>
          <p>{computedBmi ? getBmiCategory(computedBmi) : "Enter realistic measurements"}</p>
          <button className="ghostButton" onClick={() => setActiveView("prediction")}>
            Use in Prediction
          </button>
        </article>
      </section>
    </section>
  );
}

function PredictionView({
  childrenList,
  predictionForm,
  setPredictionForm,
  onPredict,
  latestPrediction,
  loading,
}) {
  const latestRecord = latestPrediction?.record;
  const calculatedBmi = calculateBmi(predictionForm.height, predictionForm.weight);
  const measurementError = getMeasurementError(
    { ...predictionForm, bmi: calculatedBmi },
    true,
    Boolean(predictionForm.height || predictionForm.weight)
  );
  const predictionError = getPredictionFormError(predictionForm, calculatedBmi);
  const latestBmi = latestRecord?.bmi || calculatedBmi;
  const recommendations = latestPrediction
    ? buildRecommendations(latestPrediction.growthStatus, latestBmi)
    : null;
  const modelInputSummary = latestPrediction
    ? [
        ["Meals", latestRecord?.meals || predictionForm.meals],
        ["Fruit/Veg", latestRecord?.fruitsVeggies || predictionForm.fruits_veggies],
        ["Protein", latestRecord?.protein || predictionForm.protein],
        ["Sleep", latestRecord?.sleep || predictionForm.sleep],
        ["Activity", latestRecord?.activity || predictionForm.activity],
        ["Screen time", latestRecord?.screenTimeCategory || predictionForm.screen_time],
        ["Medical", latestRecord?.medical || predictionForm.medical],
      ]
    : [];

  const selectChild = (childId) => {
    const child = childrenList.find((item) => item._id === childId);
    setPredictionForm({
      ...predictionForm,
      childId,
      childName: child?.name || "",
      gender: child?.gender || predictionForm.gender,
      age: child ? calculateAge(child.dateOfBirth) : predictionForm.age,
    });
  };

  const updatePredictionField = (field, value) => {
    setPredictionForm({
      ...predictionForm,
      [field]: value,
      ...(field === "height" || field === "weight" ? { bmi: "" } : {}),
    });
  };

  const syncBmi = () => {
    if (measurementError) {
      return;
    }

    setPredictionForm({
      ...predictionForm,
      bmi: calculatedBmi,
    });
  };

  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>Growth Prediction</h1>
          <p>Generate AI-based predictions using your child's latest data.</p>
        </div>
      </div>

      <form
        className={`panel predictionForm assessmentForm ${loading ? "isLoading" : ""}`}
        onSubmit={onPredict}
        aria-busy={loading}
      >
        <div className="formSection wideField">
          <span className="sectionStep">Step 1</span>
          <div>
            <h2>Child Details</h2>
            <p>Select an existing child or enter a name for this assessment.</p>
          </div>
        </div>

        <label>
          Saved Child
          <select value={predictionForm.childId} onChange={(event) => selectChild(event.target.value)}>
            <option value="">No child selected</option>
            {childrenList.map((child) => (
              <option key={child._id} value={child._id}>{child.name}</option>
            ))}
          </select>
        </label>

        <label>
          Child Name
          <input
            placeholder="Child name"
            value={predictionForm.childName}
            onChange={(event) => updatePredictionField("childName", event.target.value)}
            required
          />
        </label>

        <label>
          Age
          <input
            type="number"
            min={measurementLimits.age.min}
            max={measurementLimits.age.max}
            placeholder="e.g. 5"
            value={predictionForm.age}
            onChange={(event) => updatePredictionField("age", event.target.value)}
            required
          />
        </label>

        <label>
          Gender
          <select
            value={predictionForm.gender}
            onChange={(event) => updatePredictionField("gender", event.target.value)}
          >
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>

        <div className="formSection wideField">
          <span className="sectionStep">Step 2</span>
          <div>
            <h2>Physical</h2>
            <p>Height and weight are used to calculate BMI before prediction.</p>
          </div>
        </div>

        <label>
          Height (cm)
          <input
            type="number"
            min={measurementLimits.height.min}
            max={measurementLimits.height.max}
            placeholder="e.g. 110"
            value={predictionForm.height}
            onChange={(event) => updatePredictionField("height", event.target.value)}
            required
          />
          <small className="fieldHint">Centimeters only, for example 110.</small>
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            min={measurementLimits.weight.min}
            max={measurementLimits.weight.max}
            placeholder="e.g. 18"
            value={predictionForm.weight}
            onChange={(event) => updatePredictionField("weight", event.target.value)}
            required
          />
          <small className="fieldHint">Kilograms only, for example 18.</small>
        </label>

        <label>
          BMI
          <input
            type="number"
            step="0.1"
            min={measurementLimits.bmi.min}
            max={measurementLimits.bmi.max}
            value={calculatedBmi}
            readOnly
            required
          />
          <small className="fieldHint">Auto-calculated from height and weight.</small>
        </label>

        <div className="formSection wideField">
          <span className="sectionStep">Step 3</span>
          <div>
            <h2>Nutrition, Sleep, and Activity</h2>
            <p>These fields are sent to the trained growth status model.</p>
          </div>
        </div>

        <label>
          Meals per day
          <select value={predictionForm.meals} onChange={(event) => updatePredictionField("meals", event.target.value)}>
            {modelFeatureOptions.meals.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Milk/Protein intake
          <select value={predictionForm.protein} onChange={(event) => updatePredictionField("protein", event.target.value)}>
            {modelFeatureOptions.protein.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Screen time
          <select value={predictionForm.screen_time} onChange={(event) => updatePredictionField("screen_time", event.target.value)}>
            {modelFeatureOptions.screen_time.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Fruit/Veg intake
          <select value={predictionForm.fruits_veggies} onChange={(event) => updatePredictionField("fruits_veggies", event.target.value)}>
            {modelFeatureOptions.fruits_veggies.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Sleep hours
          <select value={predictionForm.sleep} onChange={(event) => updatePredictionField("sleep", event.target.value)}>
            {modelFeatureOptions.sleep.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Medical condition
          <select value={predictionForm.medical} onChange={(event) => updatePredictionField("medical", event.target.value)}>
            {modelFeatureOptions.medical.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Junk food frequency
          <select value={predictionForm.junk_food} onChange={(event) => updatePredictionField("junk_food", event.target.value)}>
            {modelFeatureOptions.junk_food.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Physical activity
          <select value={predictionForm.activity} onChange={(event) => updatePredictionField("activity", event.target.value)}>
            {modelFeatureOptions.activity.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Water intake (glasses)
          <input
            type="number"
            min={measurementLimits.waterIntake.min}
            max={measurementLimits.waterIntake.max}
            value={predictionForm.waterIntake}
            onChange={(event) => updatePredictionField("waterIntake", event.target.value)}
            required
          />
          <small className="fieldHint">Saved with the record; current model does not use this field.</small>
        </label>

        <div className="formActions wideField">
          <button type="button" className="ghostButton" onClick={syncBmi} disabled={Boolean(measurementError)}>
            <Calculator size={16} /> Calculate BMI
          </button>
          <button className="primaryButton" disabled={loading || Boolean(predictionError)}>
            {loading ? <><ButtonSpinner /> Predicting...</> : <><Sparkles size={16} /> Generate Prediction</>}
          </button>
        </div>
        <p className={`formMessage wideField ${predictionError ? "errorText" : "helperText"}`}>
          {predictionError || "Assessment is model-ready. BMI and lifestyle fields will be sent to the AI model."}
        </p>
      </form>

      {loading && (
        <section className="panel predictionLoader" role="status">
          <div className="loaderRing" />
          <div>
            <h2>Generating AI prediction</h2>
            <p>Checking the model result, saving the record, and preparing recommendations.</p>
          </div>
        </section>
      )}

      {latestPrediction && (
        <>
          <section className="predictionSummary">
            <div>
              <span className="eyebrow">Latest AI Result</span>
              <h2>{latestPrediction.growthStatus}</h2>
              <p>
                Saved {latestRecord?.createdAt ? formatDate(latestRecord.createdAt) : "just now"}.
                Review the recommendation plan below and keep tracking future changes.
              </p>
            </div>
            <span className={`statusPill ${getStatusClass(latestPrediction.growthStatus)}`}>
              {latestPrediction.growthStatus}
            </span>
          </section>

          <section className="resultGrid">
            <article className="resultTile cyan">
              <span>Height</span>
              <strong>{latestRecord?.height || predictionForm.height} cm</strong>
            </article>
            <article className="resultTile teal">
              <span>Weight</span>
              <strong>{latestRecord?.weight || predictionForm.weight} kg</strong>
            </article>
            <article className="resultTile green">
              <span>BMI Category</span>
              <strong>{getBmiCategory(latestBmi)}</strong>
            </article>
            <article className="resultTile purple">
              <span>Growth Status</span>
              <strong>{latestPrediction.growthStatus}</strong>
            </article>
          </section>

          <section className="panel modelInputPanel">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Model Inputs Used</span>
                <h2>Assessment details sent to AI</h2>
              </div>
            </div>
            <div className="inputChipGrid">
              {modelInputSummary.map(([label, value]) => (
                <span key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </span>
              ))}
            </div>
          </section>

          <section className="panel recommendationPanel">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Recommendation</span>
                <h2>{recommendations.headline}</h2>
                <p>{recommendations.summary}</p>
              </div>
              <div className="iconBubble"><Sparkles size={18} /></div>
            </div>
            <div className="recommendationGrid">
              {recommendations.items.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="recommendationCard" key={item.title}>
                    <span><Icon size={18} /></span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function RecordsTable({ records }) {
  if (!records.length) {
    return (
      <div className="emptyTable">
        <ClipboardList size={28} />
        <p>No growth records yet.</p>
      </div>
    );
  }

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Age</th>
            <th>Height</th>
            <th>Weight</th>
            <th>BMI</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record._id}>
              <td>{formatDate(record.createdAt)}</td>
              <td>{record.age}</td>
              <td>{record.height} cm</td>
              <td>{record.weight} kg</td>
              <td>{record.bmi}</td>
              <td><span className={`statusPill ${getStatusClass(record.growthStatus)}`}>{record.growthStatus}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryView({ historyRecords, childrenList, selectedHistoryChild, setSelectedHistoryChild, refreshHistory }) {
  const filteredRecords = useMemo(() => historyRecords, [historyRecords]);

  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>Growth History</h1>
          <p>Track height, weight, BMI, and growth changes over time.</p>
        </div>
        <button className="ghostButton" onClick={refreshHistory}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="panel historyControls">
        <label>
          Select Child
          <select value={selectedHistoryChild} onChange={(event) => setSelectedHistoryChild(event.target.value)}>
            <option value="">All children and standalone records</option>
            {childrenList.map((child) => (
              <option key={child._id} value={child._id}>{child.name}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="panel">
        <RecordsTable records={filteredRecords} />
      </section>
    </section>
  );
}

function ProfileView({ user, childrenList, history }) {
  return (
    <section className="viewStack">
      <div className="pageTitleRow">
        <div>
          <h1>My Profile</h1>
          <p>Manage your account information and review system activity.</p>
        </div>
      </div>
      <section className="profileGrid">
        <article className="panel profileCard">
          <div className="profileAvatar">{user?.name?.[0]?.toUpperCase() || "P"}</div>
          <h2>{user?.name || "Parent"}</h2>
          <p>{user?.email}</p>
          <span className="statusPill status-normal">Parent Account</span>
        </article>
        <article className="panel metricList">
          <div><span>Children</span><strong>{childrenList.length}</strong></div>
          <div><span>Records</span><strong>{history.length}</strong></div>
          <div><span>Role</span><strong>{user?.role || "parent"}</strong></div>
        </article>
      </section>
    </section>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("childGrowthToken") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("childGrowthUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [childrenList, setChildrenList] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [selectedHistoryChild, setSelectedHistoryChild] = useState("");
  const [predictionForm, setPredictionForm] = useState(initialPredictionForm);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const onAuth = (nextUser, nextToken) => {
    localStorage.setItem("childGrowthToken", nextToken);
    localStorage.setItem("childGrowthUser", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("childGrowthToken");
    localStorage.removeItem("childGrowthUser");
    setToken("");
    setUser(null);
  };

  const loadChildren = async () => {
    const data = await apiRequest("/api/children", {}, token);
    setChildrenList(data.children || []);
  };

  const loadHistory = async (childId = selectedHistoryChild) => {
    const path = childId ? `/api/growth/history/${childId}` : "/api/growth/history";
    const data = await apiRequest(path, {}, token);
    setHistoryRecords(data.data || []);
  };

  useEffect(() => {
    if (!token) return;

    Promise.all([loadChildren(), loadHistory("")]).catch((error) => {
      setNotice(error.message);
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadHistory(selectedHistoryChild).catch((error) => setNotice(error.message));
  }, [selectedHistoryChild]);

  const addChild = async (payload) => {
    await apiRequest("/api/children", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token);
    await loadChildren();
  };

  const deleteChild = async (childId) => {
    await apiRequest(`/api/children/${childId}`, { method: "DELETE" }, token);
    await loadChildren();
  };

  const submitPrediction = async (event) => {
    event.preventDefault();
    setNotice("");

    const calculatedBmi = calculateBmi(predictionForm.height, predictionForm.weight);
    const validationMessage = getPredictionFormError(predictionForm, calculatedBmi);

    if (validationMessage) {
      setNotice(validationMessage);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        childName: predictionForm.childName.trim(),
        age: Number(predictionForm.age),
        gender: predictionForm.gender,
        height: Number(predictionForm.height),
        weight: Number(predictionForm.weight),
        bmi: Number(calculatedBmi),
        meals: predictionForm.meals,
        fruits_veggies: predictionForm.fruits_veggies,
        junk_food: predictionForm.junk_food,
        protein: predictionForm.protein,
        sleep: predictionForm.sleep,
        activity: predictionForm.activity,
        screen_time: predictionForm.screen_time,
        medical: predictionForm.medical,
        waterIntake: Number(predictionForm.waterIntake),
        ...(predictionForm.childId ? { childId: predictionForm.childId } : {}),
      };
      const data = await apiRequest("/api/growth/predict", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token);
      setLatestPrediction(data.data);
      setNotice(data.message);
      await loadHistory(selectedHistoryChild);
      setActiveView("prediction");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <AuthScreen onAuth={onAuth} />;
  }

  return (
    <AppShell user={user} activeView={activeView} setActiveView={setActiveView} onLogout={logout}>
      {notice && (
        <div className={notice.includes("successfully") ? "notice success" : "notice"}>
          {notice}
        </div>
      )}
      {activeView === "dashboard" && (
        <Dashboard childrenList={childrenList} history={historyRecords} setActiveView={setActiveView} />
      )}
      {activeView === "children" && (
        <ChildrenView childrenList={childrenList} setActiveView={setActiveView} onDeleteChild={deleteChild} />
      )}
      {activeView === "add-child" && <AddChildView onAddChild={addChild} />}
      {activeView === "bmi" && (
        <BmiView predictionForm={predictionForm} setPredictionForm={setPredictionForm} setActiveView={setActiveView} />
      )}
      {activeView === "prediction" && (
        <PredictionView
          childrenList={childrenList}
          predictionForm={predictionForm}
          setPredictionForm={setPredictionForm}
          onPredict={submitPrediction}
          latestPrediction={latestPrediction}
          loading={loading}
        />
      )}
      {activeView === "history" && (
        <HistoryView
          historyRecords={historyRecords}
          childrenList={childrenList}
          selectedHistoryChild={selectedHistoryChild}
          setSelectedHistoryChild={setSelectedHistoryChild}
          refreshHistory={() => loadHistory(selectedHistoryChild)}
        />
      )}
      {activeView === "profile" && <ProfileView user={user} childrenList={childrenList} history={historyRecords} />}
    </AppShell>
  );
}

export default App;
