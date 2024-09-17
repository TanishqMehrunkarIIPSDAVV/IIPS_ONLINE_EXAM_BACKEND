const Axios = require("axios");
const mysql = require('mysql2/promise');

// Exported function to compile and run code based on language
exports.compileAndRunCode = async (req, res) => {
    try {
        const { code, language, input } = req.body;

        // Define supported languages and their versions
        const languageMap = {
            "c": { language: "c", version: "10.2.0" },
            "cpp": { language: "cpp", version: "10.2.0" },
            "python": { language: "python", version: "3.10.0" },
            "java": { language: "java", version: "15.0.2" },
            "sql": { language: "sql", version: "latest" },
            "plsql": { language: "plsql", version: "latest" }
        };

        // Check if the language is supported
        if (!languageMap[language]) {
            return res.status(400).json({ error: "Unsupported language" });
        }

        // Handle SQL and PL/SQL differently using MySQL database
        if (language === "sql" || language === "plsql") {
            try {
                const connection = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'test' });
                const [rows] = await connection.execute(code);  // Assuming code is the SQL query
                await connection.end();
                return res.status(200).json({ output: rows });
            } catch (error) {
                console.error("Error executing SQL:", error);
                return res.status(500).json({ error: "SQL execution error" });
            }
        }

        // Prepare data for code execution via Piston API
        const data = {
            language: languageMap[language].language,
            version: languageMap[language].version,
            files: [
                {
                    name: "main",
                    content: code
                }
            ],
            stdin: input || "",  // Pass user input if provided
        };

        // Axios configuration to call the Piston API
        const config = {
            method: 'post',
            url: 'https://emkc.org/api/v2/piston/execute',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        // Make a request to the Piston API to compile and run the code
        const response = await Axios(config);
        const { stdout, stderr } = response.data.run;

        // Return the result to the frontend
        return res.status(200).json({
            output: stdout || stderr || "Program finished execution"
        });

    } catch (error) {
        console.error("Error in code compilation or execution:", error);
        return res.status(500).json({ error: "Something went wrong during code execution" });
    }
};
