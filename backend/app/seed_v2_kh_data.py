from sqlmodel import Session, select
from app.db.session import engine
from app.models.kh_models import AdminArea, Place, KaalayHeedhePin, Landmark, EmergencyContact
from sqlalchemy import text
import random

def seed_v2_data():
    with Session(engine) as session:
        # Clear existing data to avoid FK conflicts
        print("Clearing existing geographic data...")
        
        # Deleting in order using text()
        session.execute(text("DELETE FROM kaalayheedhepin"))
        session.execute(text("DELETE FROM landmark"))
        session.execute(text("DELETE FROM emergencycontact"))
        session.execute(text("DELETE FROM place"))
        session.execute(text("DELETE FROM adminarea"))
        session.commit()

        # Data map: Parent City -> { 'coords': (lat, lng), 'children': [names] }
        geo_data = {
            "Mogadishu": {
                "coords": (2.0469, 45.3182),
                "children": [
                    "Afgooye", "Balcad", "Jowhar", "Lafoole", "Siinka Dheer", 
                    "Garasbaley", "Mareerey", "Carbiska", "Ceelasha Biyaha",
                    "Hamarweyne", "Warta Nabadda", "Xamar Jajab", "Cabdicasiis",
                    "Shibis", "Kaaraan", "Yaqshiid", "Dayniile", "Boondheere",
                    "Wadajir", "Dharkenley", "Hodan", "Howlwadaag", "Kaxda"
                ]
            },
            "Hargeisa": {
                "coords": (9.5624, 44.0770),
                "children": ["Gabiley", "Tog-Wajale", "Arabsiyo", "Farawayne", "Las Geel"]
            },
            "Garowe": {
                "coords": (8.4064, 48.4845),
                "children": ["Eyl", "Dangorayo", "Burtinle", "Godobjiiraan"]
            },
            "Galkacyo": {
                "coords": (6.7697, 47.4308),
                "children": ["Galdogob", "Jariban", "Bandiradley", "Bursaalax"]
            },
            "Berbera": {
                "coords": (10.4396, 45.0111),
                "children": ["Sheikh", "Abdaal"]
            },
            "Borama": {
                "coords": (9.9324, 43.1818),
                "children": ["Lughaya", "Saylac", "Dilla"]
            },
            "Erigavo": {
                "coords": (10.6167, 47.3667),
                "children": ["Badhan", "Dhahar", "Lasqoray"]
            },
            "Burao": {
                "coords": (9.5222, 45.5333),
                "children": ["Odwayne", "Caynabo", "Buhoodle"]
            },
            "Las Anod": {
                "coords": (8.4769, 47.3597),
                "children": ["Taleex", "Xudun", "Kalabaydh"]
            },
            "Dhusamareeb": {
                "coords": (5.5333, 46.3833),
                "children": ["Guriceel", "Matabaan", "Balanballe"]
            },
            "Beledweyne": {
                "coords": (4.7333, 45.2000),
                "children": ["Buuloburdu", "Jalalaqsi", "Maxaas"]
            },
            "Baidoa": {
                "coords": (3.1167, 43.6500),
                "children": ["Diinsoor", "Qansaxdheere", "Berdale", "Burhakaba"]
            },
            "Kismayo": {
                "coords": (-0.3581, 42.5454),
                "children": ["Afmadow", "Badhadhe", "Dhobley", "Jamaame", "Gobweyn"]
            },
            "Bardhere": {
                "coords": (2.3444, 42.2764),
                "children": ["Luuq", "Ceelwaaq", "Garbaxarey", "Burdhuubo"]
            },
            "Marka": {
                "coords": (1.7159, 44.7717),
                "children": ["Qoryoley", "Barawe", "Wanlaweyn", "Kurtunwarey"]
            },
            "Jilib": {
                "coords": (0.4891, 42.7664),
                "children": ["Saakow"]
            }
        }

        print("Seeding new geographic data...")
        for parent_name, info in geo_data.items():
            # Create AdminArea (Parent City)
            admin_area = AdminArea(name=parent_name, level="district") # Using 'district' as the top level now
            session.add(admin_area)
            session.commit()
            session.refresh(admin_area)

            # Create Place for the Parent City itself
            parent_place = Place(
                name=parent_name,
                type="city",
                latitude=info["coords"][0],
                longitude=info["coords"][1],
                admin_area_id=admin_area.id
            )
            session.add(parent_place)

            # Create Places for sub-areas
            for child_name in info["children"]:
                # Slight random offset for sub-areas so they don't stack exactly on parent
                lat_off = (random.random() - 0.5) * 0.1
                lng_off = (random.random() - 0.5) * 0.1
                
                child_place = Place(
                    name=child_name,
                    type="village",
                    latitude=info["coords"][0] + lat_off,
                    longitude=info["coords"][1] + lng_off,
                    admin_area_id=admin_area.id
                )
                session.add(child_place)
        
        session.commit()
        print("Done! Geographic data refactored successfully.")

if __name__ == "__main__":
    seed_v2_data()
