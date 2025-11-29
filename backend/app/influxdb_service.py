from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
import os
from datetime import datetime
from typing import Optional, Dict, Any

class InfluxDBService:
    def __init__(self):
        self.url = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
        self.token = os.getenv("INFLUXDB_TOKEN", "siac-token")
        self.org = os.getenv("INFLUXDB_ORG", "siac")
        self.bucket = os.getenv("INFLUXDB_BUCKET", "bucket_iot")

        self.client = None
        self.write_api = None
        self.query_api = None

        self._connect()

    def _connect(self):
        """Initialize InfluxDB client and APIs"""
        try:
            self.client = InfluxDBClient(
                url=self.url,
                token=self.token,
                org=self.org
            )
            self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
            self.query_api = self.client.query_api()
            print(f"Connected to InfluxDB at {self.url}")
        except Exception as e:
            print(f"Failed to connect to InfluxDB: {e}")
            self.client = None

    def is_connected(self) -> bool:
        """Check if InfluxDB connection is active"""
        return self.client is not None

    def write_measurement(self, measurement: str, tags: Dict[str, str],
                         fields: Dict[str, Any], timestamp: Optional[datetime] = None):
        """Write a single measurement point to InfluxDB"""
        if not self.is_connected():
            print("InfluxDB not connected, skipping write")
            return False

        try:
            point = Point(measurement)

            # Add tags
            for tag_key, tag_value in tags.items():
                point = point.tag(tag_key, tag_value)

            # Add fields
            for field_key, field_value in fields.items():
                point = point.field(field_key, field_value)

            # Add timestamp
            if timestamp:
                point = point.time(timestamp, WritePrecision.NS)

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error writing to InfluxDB: {e}")
            return False

    def write_sensor_data(self, device_id: str, temperature: Optional[float],
                         humidity: Optional[float], distance: Optional[float],
                         timestamp: Optional[datetime] = None):
        """Write sensor measurement data"""
        tags = {"device": device_id}
        fields = {}

        if temperature is not None:
            fields["temperature"] = temperature
        if humidity is not None:
            fields["humidity"] = humidity
        if distance is not None:
            fields["distance"] = distance

        # Add measurement name as a field for compatibility
        fields["_measurement"] = "measurement"

        if fields:
            return self.write_measurement("measurement", tags, fields, timestamp)
        return False

    def write_command(self, device_id: str, cmd_green: Optional[bool],
                     cmd_red: Optional[bool], timestamp: Optional[datetime] = None):
        """Write device command data"""
        tags = {"device": device_id}
        fields = {"_measurement": "commands"}

        if cmd_green is not None:
            fields["cmd_green"] = cmd_green
        if cmd_red is not None:
            fields["cmd_red"] = cmd_red

        if len(fields) > 1:  # More than just _measurement
            return self.write_measurement("commands", tags, fields, timestamp)
        return False

    def write_alert(self, device_id: str, distance: Optional[float],
                   distance_alert: Optional[bool], hum: Optional[float],
                   hum_high: Optional[bool], message: Optional[str],
                   temp: Optional[float], temp_high: Optional[bool],
                   temp_low: Optional[bool], timestamp: Optional[datetime] = None):
        """Write alert data"""
        tags = {"device": device_id}
        fields = {"_measurement": "alerts"}

        if distance is not None:
            fields["distance"] = distance
        if distance_alert is not None:
            fields["distanceAlert"] = distance_alert
        if hum is not None:
            fields["hum"] = hum
        if hum_high is not None:
            fields["humHigh"] = hum_high
        if message is not None:
            fields["message"] = message
        if temp is not None:
            fields["temp"] = temp
        if temp_high is not None:
            fields["tempHigh"] = temp_high
        if temp_low is not None:
            fields["tempLow"] = temp_low

        if len(fields) > 1:  # More than just _measurement
            return self.write_measurement("alerts", tags, fields, timestamp)
        return False

    def query_data(self, flux_query: str):
        """Execute a Flux query and return results"""
        if not self.is_connected():
            return None

        try:
            result = self.query_api.query(flux_query)
            return result
        except Exception as e:
            print(f"Error querying InfluxDB: {e}")
            return None

    def get_recent_measurements(self, measurement: str, limit: int = 10):
        """Get recent data from a specific measurement"""
        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "{measurement}")
        |> limit(n: {limit})
        '''
        return self.query_data(flux_query)

# Global instance
influx_service = InfluxDBService()