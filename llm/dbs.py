from pymongo import MongoClient
from datetime import datetime

uri = "mongodb+srv://cluster0.p0litw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&appName=Cluster0"
client = MongoClient(uri,
                     tls=True,
                     tlsCertificateKeyFile='cred.pem',
                    # server_api=ServerApi('1')
                    )