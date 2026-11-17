# Hosting the dashboard on Azure

This is the **frontend → Static Web App** part of the team's Azure pipeline:

```
Car data → Azure IoT Hub → Service Bus queue → Azure Functions (C#) → Storage / InfluxDB
                                                      │
                                     REST API (C# Azure Function, backend/)
                                                      │
                                     Frontend: Azure Static Web App  ← this guide
```

The repository already has everything that is needed:

| File | What it does |
|---|---|
| `.github/workflows/azure-static-web-app.yml` | On every push to `main`: tests, builds and uploads the dashboard to Azure. Every pull request gets its own preview site. |
| `frontend/public/staticwebapp.config.json` | Azure settings: page fallback, no caching for `/data/*.json`, security headers. |

You only need to create the Static Web App once and connect it to GitHub with a token.

---

## Step 1: Get access (once)

The app goes into the **team's resource group** in Mira's Azure account. Ask Mira to give you the **Contributor** role on that resource group:
*Resource group → Access control (IAM) → Add role assignment → Contributor → your account.*

(Or Mira does Step 2 and sends you the token from Step 3.)

## Step 2: Create the Static Web App (once)

1. Open <https://portal.azure.com> and sign in.
2. Search for **Static Web Apps** → **Create**.
3. Fill in **Basics**:

   | Field | Value |
   |---|---|
   | Subscription | Mira's subscription |
   | Resource group | the team's resource group |
   | Name | `green-transition-dashboard` |
   | Plan type | **Free** |
   | Region | **West Europe** (if Azure refuses the region, ask Mira which regions the subscription allows) |
   | Deployment source | **Other** (not GitHub, our workflow file does the deploying) |

4. **Review + create** → **Create**. It takes about a minute.

## Step 3: Connect GitHub (once)

1. Open the new Static Web App → **Overview** → **Manage deployment token** → **copy** the token.
2. On GitHub, open the repository → **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret**:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Secret: paste the token → **Add secret**.

Never paste this token in a chat, file or commit. Anyone with it can replace the website.

## Step 4: Deploy

On GitHub → **Actions** → **Azure Static Web App** → **Run workflow** (or just merge a pull request into `main`).
When it's green, the address is on the Static Web App's **Overview** page in Azure (`https://<name>.azurestaticapps.net`).

From now on, every merge into `main` updates the site by itself.

---

## When the backend (REST API) is hosted

Until then, the online dashboard shows the **sample routes**. When the C# Azure Function from `backend/` runs in Azure:

1. **API key:** in the Function App → **Settings → Environment variables**, add `ORS_API_KEY` with the OpenRouteService key. The key belongs here, never in GitHub.
2. **CORS:** in the Function App → **API → CORS**, add the dashboard's address (`https://<name>.azurestaticapps.net`). Without this, the browser blocks the requests.
3. **Tell the dashboard where the backend is:** on GitHub → **Settings → Secrets and variables → Actions → Variables** → **New repository variable**:
   - Name: `BACKEND_URL`
   - Value: the Function App address, e.g. `https://green-transition-api.azurewebsites.net`
4. Run the workflow again (Step 4). The Route page now shows real routes online too.

---

## Problems?

| Problem | Fix |
|---|---|
| Workflow says *"Not deployed. Add the AZURE_STATIC_WEB_APPS_API_TOKEN secret"* | Do Step 3, then run the workflow again. |
| Azure: *"The location is not allowed"* or a policy error | The subscription limits regions. Ask Mira which region to use. |
| Workflow fails at **Test** | A test is broken on `main`. Run `npm test` in `frontend/` to see which one. |
| Route page online: *"Could not get routes"* | Check that `BACKEND_URL` is right and the dashboard's address is in the Function App's CORS list. |
