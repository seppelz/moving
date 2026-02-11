# MoveMaster - Funktionsdokumentation

## 1. Projektbeschreibung

MoveMaster ist ein White-Label-SaaS-Umzugskostenrechner speziell fuer den deutschen Markt. Die Plattform bietet Umzugsunternehmen einen konfigurierbaren Angebotsrechner mit KI-gestuetzter Volumenvorhersage, detaillierter Preiskalkulation und einem umfassenden Admin-Dashboard.

**Technologie-Stack:**
- **Backend:** Python 3.11+ mit FastAPI, PostgreSQL (SQLAlchemy + Alembic)
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, Zustand (State Management)
- **Deployment:** Backend auf Railway, Frontend auf Vercel

---

## 2. Kundenrechner (6-Schritte-Wizard)

### Schritt 1: Sofort-Schaetzung (StepInstant)
- Eingabe der Postleitzahlen (Abholung und Ziel)
- Auswahl der Wohnungsgroesse (Studio, 1-Zi, 2-Zi, 3-Zi, 4-Zi+)
- Automatische Berechnung nach 500ms Eingabepause
- Zeigt sofortige Min/Max-Preisspanne inkl. MwSt-Hinweis
- Entfernung, geschaetztes Volumen und Stunden werden angezeigt

### Schritt 2: Smart-Profil (StepSmartProfile)
- 5 Kernfragen zur Profilbildung:
  1. Wohnungsgroesse
  2. Haushaltstyp (Single, Paar, Familie, WG)
  3. Einrichtungsniveau (minimalistisch, normal, viel)
  4. Homeoffice vorhanden?
  5. Wohndauer (Jahre)
- 6 optionale Sondergegenstands-Checkboxen (Klavier, Bibliothek, Fitnessgeraete, Werkstatt, Aquarium, Pflanzen)
- Progressive Darstellung: Fragen erscheinen nacheinander

### Schritt 3: KI-Vorschau (StepSmartPreview)
- Laedt KI-basierte Volumenvorhersage vom Backend
- Zeigt: vorhergesagtes Volumen, Konfidenz-Score, Raumaufteilung
- 8 Schnell-Anpassungen:
  - Moebel-Level (-2 bis +2)
  - Kartonanzahl (0-80)
  - Waschmaschine (+0,8m³)
  - Einbaukueche (mit Laufmeter-Eingabe)
  - Grosse Pflanzen (+2,0m³)
  - Fahrraeder (0-4)
- LKW-Visualisierung der Beladung
- Zwei Pfade: Inventar ueberspringen oder manuell bearbeiten

### Schritt 4: Inventar (StepInventory)
- 6 Kategorien: Auswahl, Wohnzimmer, Schlafzimmer, Kueche, Buero, Sonstiges
- Artikel-Raster mit Suche und Filter
- Mengensteuerung (Plus/Minus)
- Eigene Artikel mit Volumen-Schieberegler (0,1-10m³)
- Sticky-Zusammenfassung mit Gesamtvolumen und LKW-Visualisierung

### Schritt 5: Zusaetzliche Services (StepServices)
- **Stockwerk-Informationen:** Etage + Aufzug-Status fuer beide Adressen
- **Wunschtermin:** Datumsauswahl (optional)
- **8 Service-Optionen:**

| Service | Beschreibung | Preis |
|---------|-------------|-------|
| Packservice | Professionelles Ein-/Auspacken inkl. Materialkosten | Arbeitskosten + €8/m³ Material |
| Moebelmontage | Demontage und Aufbau | Arbeitskosten (0,15h/m³) |
| Halteverbotszone (HVZ) | Parkgenehmigung vor beiden Adressen | €120 |
| Kuechenmontage | Ab-/Aufbau mit Laufmeter-Schieberegler | €45/Laufmeter |
| Aussenaufzug | Automatisch empfohlen bei >4. OG ohne Aufzug | €350-500 |
| Entruempelung | Entsorgung mit Volumen-Schieberegler | €80 Grundgebuehr + €45/m³ |
| Langer Trageweg | Wenn LKW nicht direkt am Eingang parken kann | €35 pro 10m (erste 10m frei) |
| Transportversicherung | Basis (€49, bis €50.000) oder Premium (ab €89, Neuwert) | Siehe Details |

### Schritt 6: Kontakt & Abschluss (StepContact)
- Kontaktformular: E-Mail (Pflicht), Telefon, Name (optional)
- Checkboxen: Rueckruf gewuenscht, Umzugstipps gewuenscht
- Datenschutzhinweis
- Erfolgsbildschirm mit Angebots-ID, Preisspanne, LKW-Visualisierung und naechsten Schritten

---

## 3. Preiskalkulations-Engine

### 3.1 Basiskomponenten

Jede Komponente wird mit Min/Max-Spanne berechnet:

| Komponente | Berechnung | Standardwerte |
|------------|-----------|---------------|
| **Volumenkosten** | Volumen (m³) x Preis pro m³ | €25-35/m³ |
| **Distanzkosten** | Gestaffelter km-Preis (±10% Spanne) | €2/km (0-50km), €1/km (>50km) |
| **Arbeitskosten** | Mannstunden x Stundensatz | €60-80/Stunde |
| **Etagenzuschlag** | Basiskosten x 15% x Stockwerke ueber 2. OG | 15% pro Etage (kein Aufzug) |
| **Servicezuschlaege** | Siehe Services-Tabelle oben | Variabel |
| **Schwerlast-Zuschlag** | Pro Spezialgegenstand | Klavier €150, Tresor €120, etc. |

### 3.2 Mannstunden-Berechnung

```
Basis:           Volumen x 0,12h/m³
Treppen:         Etage x Volumen x 0,02h/m³ (kein Aufzug)
Demontage:       Volumen x 0,15h/m³
Verpackung:      Volumen x 0,25h/m³
Minimum:         4 Mannstunden
```

### 3.3 Team-Groesse

| Volumen | Team-Groesse |
|---------|-------------|
| < 20m³ | 2 Helfer |
| 20-45m³ | 3 Helfer |
| > 45m³ | 4 Helfer |

Die konfigurierte Mindest-Helferanzahl (`MIN_MOVERS`) wird immer respektiert.

### 3.4 Fahrzeit-Berechnung

- LKW-Faktor: 1,15x langsamer als PKW
- Pflichtpause bei > 4,5 Stunden: +45 Minuten
- Gesamtdauer = Ladezeit (Mannstunden / Teamgroesse) + LKW-Fahrzeit

### 3.5 Multiplikatoren

#### Regionale Preisanpassung (optional aktivierbar)
Basierend auf dem PLZ-Praefix der teureren Adresse:

| Region | Aufschlag |
|--------|----------|
| Muenchen (80xxx, 81xxx, 85xxx) | +15% |
| Frankfurt (60xxx, 61xxx, 65xxx) | +12% |
| Stuttgart (70xxx, 71xxx, 73xxx) | +10% |
| Hamburg (20xxx, 21xxx, 22xxx) | +10% |
| Berlin (10xxx, 12xxx, 13xxx, 14xxx) | +8% |
| Koeln (50xxx, 51xxx) | +5% |
| Sonstige | 0% |

#### Saisonale Preisanpassung (optional aktivierbar)

| Zeitraum | Monate | Aufschlag |
|----------|--------|----------|
| Hochsaison | Mai-September | +15% |
| Standard | Maerz-April, Oktober-November | 0% |
| Nebensaison | Dezember-Februar | 0% |

#### Wochenend-/Feiertagszuschlag

| Tag | Aufschlag |
|-----|----------|
| Samstag/Sonntag | +25% |
| Gesetzlicher Feiertag | +50% |
| Werktag | 0% |

Deutsche Feiertage: Neujahr, Tag der Arbeit, Tag der Deutschen Einheit, 1./2. Weihnachtstag

### 3.6 Schwerlast-Zuschlaege

Automatische Erkennung ueber Artikelname/-kategorie im Inventar:

| Gegenstand | Zuschlag pro Stueck |
|------------|-------------------|
| Klavier/Fluegel | €150 |
| Tresor | €120 |
| Antiquitaeten | €100 |
| Aquarium | €80 |
| Marmortisch | €80 |
| Fitnessgeraete | €60 |

### 3.7 Endpreis-Berechnung

```
Netto = (Volumen + Distanz + Arbeit + Etagenzuschlag + Services + Schwerlast)
        x Regionaler Multiplikator
        x Saisonaler Multiplikator
        x (1 + Wochenend-/Feiertagszuschlag)

MwSt  = Netto x 19%
Brutto = Netto + MwSt
```

Alle Berechnungen verwenden `Decimal`-Praezision fuer exakte Finanzberechnungen.

---

## 4. KI-Volumenvorhersage (Smart Predictor)

### Funktionsweise
1. Benutzer-Eingaben (Wohnungsgroesse + Haushaltstyp + Einrichtungsniveau) werden mit vordefinierten Wohnungsprofilen abgeglichen
2. Profile enthalten Basis-Volumen und typische Gegenstandslisten
3. Anpassungen basierend auf:
   - Homeoffice: +4m³
   - Kinder im Haushalt: +8m³
   - Wohndauer: +1% pro Jahr (max. 10 Jahre)
   - Sondergegenstaende: Klavier 4m³, Fitnessgeraete 5m³, Werkstatt 8m³, etc.

### Konfidenz-Score
- Basis-Score aus Profil-Matching
- +5% Bonus bei vollstaendigen Angaben
- Typisch: 85-95% Genauigkeit
- Volumenspanne: ±12% vom Vorhersagewert

### Fallback-Vorhersage
Falls kein Profil passt, werden Standardvolumen verwendet:
- Studio: 15m³
- 1-Zimmer: 25m³
- 2-Zimmer: 40m³
- 3-Zimmer: 55m³
- 4-Zimmer+: 70m³

---

## 5. Admin-Dashboard

### 5.1 Login & Authentifizierung
- JWT-basierte Anmeldung (HS256, 30 Minuten Gueltigkeit)
- Standard-Zugangsdaten ueber Umgebungsvariablen konfigurierbar
- Automatische Weiterleitung bei abgelaufenem Token
- Alle Admin-Endpunkte sind geschuetzt

### 5.2 Dashboard-Uebersicht
- 4 KPI-Karten: Angebote (30 Tage), Durchschnittswert, Conversion Rate, Gesamtumsatz
- Conversion-Funnel: Erstellt -> Gesendet -> Akzeptiert
- Effizienz-Metriken: Durchschn. Volumen, Durchschn. Angebotswert
- Zusammenfassung: In Bearbeitung vs. Abgeschlossen
- Tabelle der neuesten Angebote mit PDF-Download

### 5.3 Angebotsverwaltung
- **Filtern:** Status, Suche nach E-Mail/Name/PLZ
- **CSV-Export:** Alle Angebote mit deutscher Zeichenkodierung (BOM)
- **Statusverwaltung:**
  - Entwurf -> Gesendet -> Akzeptiert/Abgelehnt
  - Automatischer Ablauf nach 14 Tagen (Hintergrund-Task)
- **Angebots-Detail:**
  - 3-Spalten-Layout: Kundendaten, Umzugsdetails, Preisaufschluesselung
  - Inventar-Tabelle (Artikel, Menge, Volumen)
  - Services-Liste
  - Bearbeitungsmodus: Min/Max-Preise, Volumen, Festpreis-Option
  - Neuberechnung basierend auf neuem Volumen
  - Komplexitaets-Indikatoren (Treppen, Volumen, Distanz, Services)
- **PDF-Generierung:** Angebots-PDF mit allen Details

### 5.4 Preiskonfiguration
- **Visuelle Konfiguration** aller Preisparameter:
  - Volumenpreise (€/m³ Min/Max)
  - Distanzraten (€/km Nah/Fern, Schwelle)
  - Arbeitskosten (Stundensatz, Min. Helfer)
  - Etagenzuschlag (%)
  - Servicepauschalen (HVZ, Kueche, Aussenaufzug)
  - Erweiterte Einstellungen (regional, saisonal)
- **Live-Vorschau:** Beispielrechnung mit aktuellen Parametern
- **Marktpositionierung:** Vergleich mit Branchendurchschnitt
- Jeder Parameter hat Schieberegler + Zahleneingabe + Hilfetext

### 5.5 Feedback & Genauigkeits-Tracking

#### Feedback erfassen
- **Endpunkt:** `POST /api/v1/admin/quotes/{id}/feedback`
- Felder: Tatsaechliche Kosten, tatsaechliches Volumen, tatsaechliche Stunden, Bewertung (1-5 Sterne), Anmerkungen
- Automatische Genauigkeitsberechnung:
  - Lag der tatsaechliche Preis innerhalb der Spanne?
  - Abweichung in % vom Mittelwert
  - Volumen-Abweichung in %

#### Genauigkeitsbericht
- **Endpunkt:** `GET /api/v1/admin/accuracy`
- Aggregierte Auswertung ueber einstellbaren Zeitraum (7-365 Tage)
- Metriken:
  - Anteil der Angebote innerhalb der Preisspanne
  - Durchschnittliche Kostenabweichung
  - Durchschnittliche Volumenabweichung
  - Durchschnittliche Kundenbewertung

---

## 6. Multi-Tenant / White-Label

- Jedes Umzugsunternehmen erhaelt eigenen `company_slug`
- Pro Unternehmen konfigurierbar:
  - Eigene Preiskonfiguration (ueberschreibt Standardwerte)
  - Branding (Logo, Farben, Name)
  - Angebote sind auf `company_id` gefiltert
- Hooks vorhanden: `useBranding.ts` fuer dynamisches Frontend-Branding

---

## 7. API-Endpunkte (Vollstaendige Referenz)

### Oeffentliche Endpunkte (kein Login noetig)

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| POST | `/api/v1/quote/calculate` | Sofort-Kalkulation |
| POST | `/api/v1/quote/submit` | Vollstaendiges Angebot absenden |
| GET | `/api/v1/quote/inventory/templates` | Artikel-Vorlagen |
| GET | `/api/v1/quote/room/templates` | Raum-Vorlagen nach Wohnungsgroesse |
| POST | `/api/v1/quote/validate-address` | PLZ-Validierung |
| POST | `/api/v1/smart/smart-prediction` | KI-Volumenvorhersage |
| POST | `/api/v1/smart/quick-adjustment` | Vorhersage anpassen |
| GET | `/api/v1/smart/profiles` | Verfuegbare Profile |
| GET | `/api/v1/smart/profile/{key}` | Profil-Details |

### Admin-Endpunkte (JWT erforderlich)

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| POST | `/api/v1/auth/login` | Admin-Login |
| GET | `/api/v1/auth/me` | Aktueller Benutzer |
| GET | `/api/v1/admin/quotes` | Angebotsliste (Filter, Paginierung) |
| GET | `/api/v1/admin/quotes/{id}` | Einzelnes Angebot |
| PATCH | `/api/v1/admin/quotes/{id}` | Status aendern |
| PATCH | `/api/v1/admin/quotes/{id}/details` | Preise/Volumen ueberschreiben |
| POST | `/api/v1/admin/quotes/{id}/pdf` | PDF generieren |
| GET | `/api/v1/admin/quotes/{id}/breakdown` | Detaillierte Preisaufschluesselung |
| POST | `/api/v1/admin/quotes/{id}/feedback` | Feedback/Ist-Kosten erfassen |
| GET | `/api/v1/admin/analytics` | Dashboard-Analytik |
| GET | `/api/v1/admin/accuracy` | Genauigkeitsbericht |
| GET | `/api/v1/admin/pricing` | Aktuelle Preiskonfiguration |
| PUT | `/api/v1/admin/pricing` | Preiskonfiguration aktualisieren |

---

## 8. Umgebungsvariablen

### Backend
| Variable | Beschreibung | Standard |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL-Verbindung | `sqlite:///./test.db` |
| `SECRET_KEY` | JWT-Schluessel | dev-secret (AENDERN!) |
| `ADMIN_USERNAME` | Admin-Benutzername | admin |
| `ADMIN_PASSWORD` | Admin-Passwort | movemaster2026 (AENDERN!) |
| `GOOGLE_MAPS_API_KEY` | Google Maps fuer Entfernungsberechnung | - |
| `SMTP_USER` / `SMTP_PASSWORD` | E-Mail-Versand | - |
| `SUPABASE_URL` / `SUPABASE_KEY` | Optionale Cloud-Services | - |

### Frontend
| Variable | Beschreibung | Standard |
|----------|-------------|---------|
| `VITE_API_URL` | Backend-URL | `http://localhost:8000` |

---

## 9. Datenbank-Schema

### Tabelle: `quotes`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | UUID | Primaerschluessel |
| company_id | UUID | Fremdschluessel Unternehmen |
| customer_email | VARCHAR | Kunden-E-Mail (Pflicht) |
| customer_phone | VARCHAR | Telefon (optional) |
| customer_name | VARCHAR | Name (optional) |
| moving_date | VARCHAR | Wunschtermin (ISO-Datum) |
| wants_callback | BOOLEAN | Rueckruf gewuenscht |
| wants_moving_tips | BOOLEAN | Umzugstipps gewuenscht |
| origin_address | JSON | Abholadresse inkl. PLZ, Etage, Aufzug |
| destination_address | JSON | Zieladresse |
| distance_km | NUMERIC | Entfernung in km |
| estimated_hours | NUMERIC | Geschaetzte Dauer |
| inventory | JSON | Inventarliste mit Mengen und Volumen |
| services | JSON | Ausgewaehlte Zusatzservices |
| min_price | NUMERIC | Mindestpreis (brutto) |
| max_price | NUMERIC | Hoechstpreis (brutto) |
| volume_m3 | NUMERIC | Gesamtvolumen in m³ |
| status | ENUM | draft/sent/accepted/rejected/expired |
| is_fixed_price | BOOLEAN | Festpreis statt Spanne |
| actual_cost | NUMERIC | Tatsaechliche Kosten (Feedback) |
| actual_volume_m3 | NUMERIC | Tatsaechliches Volumen (Feedback) |
| actual_hours | NUMERIC | Tatsaechliche Stunden (Feedback) |
| feedback_notes | VARCHAR | Anmerkungen (Feedback) |
| feedback_rating | NUMERIC | Bewertung 1-5 Sterne (Feedback) |
| created_at | DATETIME | Erstellungszeitpunkt |
| updated_at | DATETIME | Letzte Aenderung |

---

## 10. Deployment

### Backend (Railway)
```bash
# Dockerfile fuehrt aus:
alembic upgrade head    # Migrationen
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (Vercel)
```bash
tsc && vite build    # TypeScript-Pruefung + Produktions-Build
```

### Vollstaendig (Docker Compose)
```bash
docker-compose up    # PostgreSQL:5432, Backend:8000, Frontend:3000
```

---

## 11. Sicherheitshinweise

- JWT-Tokens haben 30 Minuten Gueltigkeit
- Admin-Passwoerter muessen in Produktion ueber Umgebungsvariablen gesetzt werden
- Alle Admin-Endpunkte erfordern gueltigen Bearer-Token
- CORS ist auf konfigurierte Origins beschraenkt
- Alle Preisberechnungen verwenden Decimal-Praezision (keine Gleitkomma-Fehler)
- Passwort-Hashing mit bcrypt

---

*Letzte Aktualisierung: Februar 2026*
*Version: MoveMaster v1.0*
