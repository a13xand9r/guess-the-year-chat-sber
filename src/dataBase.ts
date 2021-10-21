import { MongoClient } from 'mongodb'
// require('dotenv').config()

const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_CLIENT ?? '')
let yearDB: any
let isMongoConnected = false
export const start = async () => {
  console.log('MongoDB trying connect')
  try {
    await client.connect()
    isMongoConnected = true
    console.log('MongoDB connected')
    yearDB = client.db().collection('guess year')
  } catch (err) {
    console.log(err)
  }
}

export const getUsersYear = async (question: string, year: number): Promise<number[]> => {
  try {
    if (!isMongoConnected){
      await client.connect()
      yearDB = client.db().collection('guess year')
    }
    const event = await yearDB.findOne({ question })
    if (event) {
        await yearDB.updateOne({ question }, {
          $set: { question, usersYear: [...event.usersYear, year] }
        })
      } else {
        yearDB.insertOne({ question, usersYear: [year] })
      }
    if (event) return event.usersYear
    else return []
  } catch (err) {
    console.log('mongoDB get score error: ', err)
    return []
  }
}