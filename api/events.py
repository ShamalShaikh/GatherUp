from flask import Blueprint, jsonify, request
from models.mongo import MongoDB
from datetime import datetime, timedelta

events_bp = Blueprint('events', __name__)

@events_bp.route('/events', methods=['GET'])
def get_events():
    """Get events with optional filtering"""
    mongo = MongoDB()
    try:
        # Build query filter
        query = {}
        
        # Category filter
        category = request.args.get('category')
        if category:
            query['categories'] = category
        
        # Date range filter
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        if start_date or end_date:
            date_query = {}
            try:
                if start_date:
                    # Normalize to second precision
                    start_dt = datetime.fromisoformat(start_date).replace(microsecond=0)
                    date_query['$gte'] = start_dt
                if end_date:
                    # Normalize to second precision
                    end_dt = datetime.fromisoformat(end_date).replace(microsecond=0)
                    # Add one day to include events on the end date
                    end_dt = end_dt + timedelta(days=1)
                    date_query['$lt'] = end_dt
                query['startDateTime'] = date_query
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
        
        # Execute query and sort by start date
        events = list(mongo.db.events.find(query).sort('startDateTime', 1))
        
        # Convert ObjectId to string for JSON serialization
        for event in events:
            event['_id'] = str(event['_id'])
            # Convert datetime objects to ISO format strings, normalized to second precision
            event['startDateTime'] = event['startDateTime'].replace(microsecond=0).isoformat()
            event['endDateTime'] = event['endDateTime'].replace(microsecond=0).isoformat()
            if 'created_at' in event:
                event['created_at'] = event['created_at'].replace(microsecond=0).isoformat()
            if 'updated_at' in event:
                event['updated_at'] = event['updated_at'].replace(microsecond=0).isoformat()
        
        return jsonify({'events': events})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        mongo.close() 