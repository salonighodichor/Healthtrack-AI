from app import app
from models import db, User, RecoveryTask, DailyActivity, Medicine, Alert
from datetime import date

with app.app_context():

    db.create_all()

    USER_ID = 1   # <-- rani ki actual Patient ID (screenshot se confirm hui)

    patient = User.query.get(USER_ID)

    if not patient:
        print(f"❌ Patient ID {USER_ID} nahi mila database mein. Pehle check karo sahi ID kya hai.")
    else:
        today = date.today()

      
        RecoveryTask.query.filter_by(user_id=USER_ID, date=today).delete()
        DailyActivity.query.filter_by(user_id=USER_ID, date=today).delete()
        Medicine.query.filter_by(user_id=USER_ID, date=today).delete()
        db.session.commit()

        # --- Recovery Tasks ---
        db.session.add_all([
            RecoveryTask(user_id=USER_ID, date=today, name="Morning stretch — 15 min",
                         tag="Exercise", status="done", meta="Completed at 8:10 AM"),
            RecoveryTask(user_id=USER_ID, date=today, name="Take Vitamin D — 1 tablet",
                         tag="Medicine", status="pending", meta="Due 1:00 PM"),
            RecoveryTask(user_id=USER_ID, date=today, name="Evening walk — 20 min",
                         tag="Exercise", status="pending", meta="Due 6:00 PM"),
            RecoveryTask(user_id=USER_ID, date=today, name="How are you feeling today?",
                         tag="Check-in", status="pending", meta="Quick check-in"),
        ])

        # --- Daily Activities (Dashboard "Daily Activity" card ke liye) ---
        db.session.add_all([
            DailyActivity(user_id=USER_ID, date=today, name="Morning Walk",
                           duration=15, status="done", meta="Completed"),
            DailyActivity(user_id=USER_ID, date=today, name="Breathing Exercise",
                           duration=10, status="done", meta="Completed"),
            DailyActivity(user_id=USER_ID, date=today, name="Stretching",
                           duration=10, status="pending", meta="Not done yet"),
        ])

        # --- Medicines ---
        db.session.add_all([
            Medicine(user_id=USER_ID, name="Aspirin 75mg", instruction="1 tablet • After breakfast",
                     status="taken", date=today),
            Medicine(user_id=USER_ID, name="Atorvastatin 10mg", instruction="1 tablet • After dinner",
                     status="pending", date=today),
        ])

        db.session.commit()

        print(f"✅ rani (Patient ID {USER_ID}) ke liye data successfully add ho gaya!")