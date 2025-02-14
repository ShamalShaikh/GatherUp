from pymongo import MongoClient
from core.config import config
from datetime import datetime
from bson import ObjectId

class MongoDB:
    def __init__(self, uri=None):
        self.client = MongoClient(uri or config['development'].MONGO_URI)
        self.db = self.client.get_default_database()
        
    def close(self):
        self.client.close()

class Event:
    collection_name = 'events'
    
    @classmethod
    def create(cls, db, event_data):
        """Create a new event"""
        # Ensure required fields
        required_fields = ['title', 'description', 'startDateTime', 'endDateTime', 'location', 'categories']
        for field in required_fields:
            if field not in event_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate location format
        if not isinstance(event_data['location'], dict) or 'coordinates' not in event_data['location']:
            raise ValueError("Location must include coordinates")
            
        # Validate categories
        if not isinstance(event_data['categories'], list):
            raise ValueError("Categories must be a list")
            
        # Add timestamps
        event_data['created_at'] = datetime.utcnow()
        event_data['updated_at'] = datetime.utcnow()
        
        # Insert document
        result = db.db[cls.collection_name].insert_one(event_data)
        event_data['_id'] = result.inserted_id
        return event_data
    
    @classmethod
    def get_by_id(cls, db, event_id):
        """Get event by ID"""
        if isinstance(event_id, str):
            event_id = ObjectId(event_id)
        return db.db[cls.collection_name].find_one({'_id': event_id})
    
    @classmethod
    def find(cls, db, query=None):
        """Find events by query"""
        return list(db.db[cls.collection_name].find(query or {})) 