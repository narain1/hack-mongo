from pymongo import MongoClient

uri = "mongodb+srv://cluster0.p0litw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&appName=Cluster0"
client = MongoClient(uri,
                     tls=True,
                     tlsCertificateKeyFile='cred.pem',
                    # server_api=ServerApi('1')
                    )

db = client['testDB']
collection = db['testCol']
doc_count = collection.count_documents({})
print(doc_count)

