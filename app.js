const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// Creating a server
const app = express();

// Data use in JSON format
app.use(express.json());

// Path of data base
const dbPath = path.join(__dirname, 'covid19India.db');

// Creating function for initilizingServerAndDB
let db = null;
const initilizingServerAndDB = async() => {
    try{
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, ()=> {
            console.log('Server Running at http://localhost:3000/')
        });
    }catch(error){
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    };
}

// Calling function
initilizingServerAndDB();

// Returns a list of all states in the state table API
app.get('/states/', async (req,res) => {
    const queryOfGetingStates = `SELECT * FROM state;`;
    try{
        const listOfStates = await db.all(queryOfGetingStates);
        const statesObjList = listOfStates.map(state => ({stateId:state.state_id, stateName:state.state_name, population:state.population}));
        res.send(statesObjList);
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error retrieving list of state'})
    };
});

// Returns a state based on the state ID API
app.get('/states/:stateId/', async (req,res) => {
    const {stateId} = req.params;
    const queryForGettingState = `SELECT * FROM state WHERE state_id = ${stateId};`;
    try{
        const state = await db.get(queryForGettingState);
        const stateObj = (state) => {
            return {
                stateId:state.state_id, stateName:state.state_name, population:state.population
            }
        };
        res.send(stateObj(state));
    }catch(error){
        console.log(error)
        res.status(500).send({message: 'Error retrieving state'});
    };
});

// Create a district in the district table, district_id is auto-incremented API
app.post('/districts/', async (req,res) => {
    const districtsDetails = req.body;
    const {districtName, stateId, cases, cured, active, deaths} = districtsDetails;
    const queryForAddingNewDistrictDetail = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `;
    try{
        await db.run(queryForAddingNewDistrictDetail);
        res.send("District Successfully Added");
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error in adding new district details'})
    };
});


// Returns a district based on the district ID API
app.get('/districts/:districtId/', async (req,res) => {
    const {districtId} = req.params;
    const queryForGettingDistrict = `SELECT * FROM district WHERE district_id = ${districtId};`;
    try{
        const district = await db.get(queryForGettingDistrict);
        const districtObj = (district) => {
            return {
                districtId: district.district_id,
                districtName: district.district_name,
                stateId: district.state_id,
                cases: district.cases,
                cured: district.cured,
                active: district.active,
                deaths: district.deaths,
            }
        }
        res.send(districtObj(district));
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error in retrieving district details'})
    };
});


// Deletes a district from the district table based on the district ID API
app.delete('/districts/:districtId/', async (req,res) => {
    const {districtId} = req.params;
    const queryForDeletingDistrictDetail = `DELETE FROM district WHERE district_id = ${districtId};`;
    try{
        db.run(queryForDeletingDistrictDetail);
        res.send("District Removed");
    }catch(error){
        console.log(error);
        res.send(500).send({message: 'Error in deleting district details'})
    }
});


// Updates the details of a specific district based on the district ID API
app.put('/districts/:districtId/', async (req,res) => {
    const {districtId} = req.params;
    const districtDetails = req.body;
    const {districtName, stateId, cases, cured, active, deaths} = districtDetails
    const queryForUpdatingDistrictDetails = `UPDATE district SET 
    district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} 
    WHERE district_id = ${districtId};`;
    try{
        await db.run(queryForUpdatingDistrictDetails);
        res.send("District Details Updated");
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error in updating district details'});
    }
});

// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID API
app.get('/states/:stateId/stats/', async (req,res) => {
    const {stateId} = req.params;
    const queryForGettingStatistics = `SELECT
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};`;
    try{
        const statisticalData = await db.get(queryForGettingStatistics);
        res.send(statisticalData);
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error in fetching data'});
    };
});


// Returns an object containing the state name of a district based on the district ID API
app.get('/districts/:districtId/details/', async (req,res) => {
    const {districtId} = req.params;
    const queryForGetingState = `SELECT state.state_name AS stateName 
    FROM state INNER JOIN district ON state.state_id = district.state_id WHERE district.district_id = ${districtId};`;
    try{
        const stateObj = await db.get(queryForGetingState);
        res.send(stateObj);
    }catch(error){
        console.log(error);
        res.status(500).send({message: 'Error in fetching data'});
    };
});

module.exports = app;