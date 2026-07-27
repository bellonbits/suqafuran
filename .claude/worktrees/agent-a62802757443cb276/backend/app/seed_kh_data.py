from sqlmodel import Session, select
from app.db.engine import engine
from app.models.kh_models import AdminArea, Place, EmergencyContact

def seed_geographic_data():
    with Session(engine) as session:
        # 1. States
        benadir = AdminArea(name="Benadir", level="state")
        puntland = AdminArea(name="Puntland", level="state")
        session.add(benadir)
        session.add(puntland)
        session.commit()
        session.refresh(benadir)
        session.refresh(puntland)

        # 2. Districts
        mogadishu = AdminArea(name="Mogadishu", level="district", parent_id=benadir.id)
        garowe = AdminArea(name="Garowe", level="district", parent_id=puntland.id)
        session.add(mogadishu)
        session.add(garowe)
        session.commit()
        session.refresh(mogadishu)
        session.refresh(garowe)

        # 3. Places
        moga_city = Place(name="Mogadishu", type="city", latitude=2.0469, longitude=45.3182, admin_area_id=mogadishu.id)
        garo_city = Place(name="Garowe", type="city", latitude=8.4064, longitude=48.4845, admin_area_id=garowe.id)
        session.add(moga_city)
        session.add(garo_city)

        # 4. Emergency Contacts
        session.add(EmergencyContact(service_type="Police", phone_number="888", admin_area_id=mogadishu.id))
        session.add(EmergencyContact(service_type="Fire", phone_number="555", admin_area_id=mogadishu.id))
        
        session.commit()
        print("Geographic data seeded successfully.")

if __name__ == "__main__":
    seed_geographic_data()
