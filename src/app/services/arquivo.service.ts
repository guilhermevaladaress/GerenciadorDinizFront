// service/arquivo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArquivoResponseDTO } from '../models/arquivo-response.dto';


@Injectable({
  providedIn: 'root'
})
export class ArquivoService {

  private readonly API = 'http://localhost:8080/arquivos';

  constructor(private http: HttpClient) {}

  listar(): Observable<ArquivoResponseDTO[]> {
    return this.http.get<ArquivoResponseDTO[]>(this.API);
  }

  buscarPorId(id: number): Observable<ArquivoResponseDTO> {
    return this.http.get<ArquivoResponseDTO>(`${this.API}/${id}`);
  }

  upload(arquivo: File, idEmpresa: number, idUsuario: number, idPasta: number): Observable<ArquivoResponseDTO> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('idEmpresa', idEmpresa.toString());
    formData.append('idUsuario', idUsuario.toString());
    formData.append('idPasta', idPasta.toString());

    return this.http.post<ArquivoResponseDTO>(this.API, formData);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.API}/${id}/download`, { responseType: 'blob' });
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}