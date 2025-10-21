#!/bin/bash
# Script para corrigir integração de security.js, database.js e auto-test.html

BASE="/home/ubuntu/gmp-portal"

echo "🗂️ Criando backups..."
cp "$BASE/assets/js/security.js" "$BASE/assets/js/security.js.bak_$(date +%Y%m%d%H%M%S)"
cp "$BASE/assets/js/database.js" "$BASE/assets/js/database.js.bak_$(date +%Y%m%d%H%M%S)"
cp "$BASE/auto-test.html" "$BASE/auto-test.html.bak_$(date +%Y%m%d%H%M%S)"

echo "🔐 Corrigindo security.js..."
# Insere salvamento do token JWT no loginUser
sed -i '/if (response.ok && data.success) {/a \ \ \ \ localStorage.setItem("authToken", data.token);' "$BASE/assets/js/security.js"

echo "🗄️ Corrigindo database.js..."
# Substitui execute() e query() por versões com fetch real
sed -i '/async execute(/,/^    }/c\
    async execute(sql, params = []) {\n\
        try {\n\
            const token = localStorage.getItem("authToken");\n\
            const res = await fetch("/api/db/execute", {\n\
                method: "POST",\n\
                headers: {\n\
                    "Content-Type": "application/json",\n\
                    "Authorization": "Bearer " + token\n\
                },\n\
                body: JSON.stringify({ sql, params })\n\
            });\n\
            return await res.json();\n\
        } catch (error) {\n\
            return { success: false, error: error.message };\n\
        }\n\
    }' "$BASE/assets/js/database.js"

sed -i '/async query(/,/^    }/c\
    async query(sql, params = []) {\n\
        try {\n\
            const token = localStorage.getItem("authToken");\n\
            const res = await fetch("/api/db/query", {\n\
                method: "POST",\n\
                headers: {\n\
                    "Content-Type": "application/json",\n\
                    "Authorization": "Bearer " + token\n\
                },\n\
                body: JSON.stringify({ sql, params })\n\
            });\n\
            return await res.json();\n\
        } catch (error) {\n\
            return { success: false, error: error.message };\n\
        }\n\
    }' "$BASE/assets/js/database.js"

echo "🧪 Atualizando auto-test.html..."
# Substitui runTest() por versão real
sed -i '/async function runTest()/,/^}/c\
async function runTest() {\n\
    if (isTestRunning) return;\n\
    isTestRunning = true;\n\
    const runButton = document.getElementById("runTest");\n\
    runButton.disabled = true;\n\
    runButton.textContent = "Executando...";\n\
    consoleElement.innerHTML = "";\n\
    const startTime = Date.now();\n\
    try {\n\
        const login = await loginUser("demo@gmp.com", "password");\n\
        if (!login.success) {\n\
            console.log("[ERROR] Login", login.error);\n\
            return;\n\
        }\n\
        console.log("[SUCCESS] Login", login.user.email);\n\
        const users = await dbManager.query("SELECT id, email, role FROM User LIMIT 5");\n\
        console.log(users.success ? "[SUCCESS] Query Users " + JSON.stringify(users.data) : "[ERROR] Query Users " + users.error);\n\
        const courses = await dbManager.query("SELECT id, title, category FROM Course LIMIT 5");\n\
        console.log(courses.success ? "[SUCCESS] Query Courses " + JSON.stringify(courses.data) : "[ERROR] Query Courses " + courses.error);\n\
        const lessons = await dbManager.query("SELECT id, title, courseId FROM Lesson LIMIT 5");\n\
        console.log(lessons.success ? "[SUCCESS] Query Lessons " + JSON.stringify(lessons.data) : "[ERROR] Query Lessons " + lessons.error);\n\
        const duration = Date.now() - startTime;\n\
        document.getElementById("testDuration").textContent = duration + "ms";\n\
        console.log("✅ Testes concluídos em " + duration + "ms");\n\
    } catch (error) {\n\
        console.log("[ERROR] Execução", error.message);\n\
    } finally {\n\
        isTestRunning = false;\n\
        runButton.disabled = false;\n\
        runButton.textContent = "Executar teste completo";\n\
    }\n\
}' "$BASE/auto-test.html"

echo "✅ Correções aplicadas com sucesso!"
