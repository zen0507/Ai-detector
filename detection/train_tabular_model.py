import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# LOAD DATA (example)
df = pd.read_csv("creditcard.csv")
df = df.sample(50000, random_state=42)

# FEATURES & LABEL
X = df.drop("Class", axis=1)   # fraud label
y = df["Class"]

# SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# MODEL
model = RandomForestClassifier(
    n_estimators=30,      # reduce trees
    max_depth=10,         # limit depth
    n_jobs=-1,            # use all CPU cores
    random_state=42
)


# TRAIN
model.fit(X_train, y_train)

# TEST
preds = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, preds))

# SAVE MODEL
joblib.dump(model, "models/fraud_model.pkl")

print("fraud_model.pkl created successfully")
