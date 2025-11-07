from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import folium
from folium.plugins import MarkerCluster

# Load the data once when the application starts
try:
    df = pd.read_csv("rajasthan_crime_mock_final_with_type.csv")
except FileNotFoundError:
    raise RuntimeError("rajasthan_crime_mock_final_with_type.csv not found. "
                       "Please ensure the file is in the same directory.")

# Define the data model for the API request body
class Location(BaseModel):
    latitude: float
    longitude: float

# Initialize the FastAPI app
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
origins = ["*"]  # This allows all origins. For production, you should specify your domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# This function generates the map
def create_map(lat, lon):
    # Create a base map centered at the given latitude and longitude
    m = folium.Map(location=[lat, lon], zoom_start=12)

    # Add a marker for the user's current location
    folium.Marker(
        [lat, lon],
        tooltip="Your Location",
        icon=folium.Icon(color='blue')
    ).add_to(m)

    # Create a MarkerCluster object for the crime data
    marker_cluster = MarkerCluster().add_to(m)

    # Add markers for each crime entry in your dataset
    for _, row in df.iterrows():
        folium.Marker(
            location=[row['latitude'], row['longitude']],
            tooltip=f"Type: {row['crime_type']}<br>Date: {row['date']}<br>Total Crimes: {row['total_crimes']}"
        ).add_to(marker_cluster)

    # Return the HTML representation of the map
    return m._repr_html_()

# Define the API endpoint that will handle the location data
@app.post("/generate_map/")
def generate_map(location: Location):
    """
    Generates an HTML map with crime data centered on the provided latitude and longitude.
    """
    # Call the map creation function with the received data
    map_html = create_map(location.latitude, location.longitude)

    # Return the HTML as a response
    return {"map_html": map_html}