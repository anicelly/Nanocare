package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Sector struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Occupancy     int    `json:"occupancy"`
	AvailableBeds int    `json:"availableBeds"`
	Status        string `json:"status"`
}

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]string{"service": "hospital-core-go", "status": "online"})
	})

	http.HandleFunc("/api/sectors", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, []Sector{
			{ID: "recepcao", Name: "Recepcao", Occupancy: 62, AvailableBeds: 8, Status: "normal"},
			{ID: "triagem", Name: "Triagem", Occupancy: 91, AvailableBeds: 2, Status: "warning"},
			{ID: "uti", Name: "UTI", Occupancy: 98, AvailableBeds: 1, Status: "critical"},
			{ID: "centro-cirurgico", Name: "Centro Cirurgico", Occupancy: 58, AvailableBeds: 5, Status: "normal"},
			{ID: "pediatria", Name: "Pediatria", Occupancy: 84, AvailableBeds: 4, Status: "warning"},
		})
	})

	log.Println("hospital-core-go online at http://localhost:8090")
	log.Fatal(http.ListenAndServe(":8090", nil))
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
