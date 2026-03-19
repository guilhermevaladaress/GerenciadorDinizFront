import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArquivoResponseDTO } from '../../../models/arquivo-response.dto';
import { EmpresaResponseDTO } from '../../../models/empresa-response.dto';
import { PastaResponseDTO } from '../../../models/pasta-response.dto';
import { ArquivoService } from '../../../services/arquivo.service';
import { AuthService } from '../../../services/auth.service';
import { EmpresaService } from '../../../services/empresa.service';
import { PastaService } from '../../../services/pasta.service';
import { SocioService } from '../../../services/socio.service';
import { UsuarioService } from '../../../services/usuario.service';

interface DadoGrafico {
  empresa: string;
  total: number;
  percentual: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  nomeUsuario = '';
  dataAtual = '';

  totalEmpresas = 0;
  totalArquivos = 0;
  totalPastas = 0;
  totalUsuarios = 0;
  totalSocios = 0;
  totalStorage = '0 B';

  arquivos: ArquivoResponseDTO[] = [];
  empresas: EmpresaResponseDTO[] = [];
  pastas: PastaResponseDTO[] = [];
  arquivosRecentes: ArquivoResponseDTO[] = [];
  dadosGrafico: DadoGrafico[] = [];

  carregando = true;

  constructor(
    private arquivoService: ArquivoService,
    private empresaService: EmpresaService,
    private pastaService: PastaService,
    private usuarioService: UsuarioService,
    private socioService: SocioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const payload = this.authService.getPayload();
    const email = payload?.sub ?? '';
    this.nomeUsuario = email.split('@')[0];
    this.dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;

    this.empresaService.listar().subscribe({
      next: (data) => {
        this.empresas = data;
        this.totalEmpresas = data.length;
      }
    });

    this.pastaService.listar().subscribe({
      next: (data) => {
        this.pastas = data;
        this.totalPastas = data.length;
      }
    });

    this.usuarioService.listar().subscribe({
      next: (data) => { this.totalUsuarios = data.length; }
    });

    this.socioService.listar().subscribe({
      next: (data) => { this.totalSocios = data.length; }
    });

    this.arquivoService.listar().subscribe({
      next: (data) => {
        this.arquivos = data;
        this.totalArquivos = data.length;
        this.arquivosRecentes = [...data].slice(0, 8);
        this.totalStorage = this.calcularStorage(data);
        this.gerarGrafico(data);
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  calcularStorage(arquivos: ArquivoResponseDTO[]): string {
    const total = arquivos.reduce((acc, a) => acc + a.tamanho, 0);
    if (total < 1024) return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    if (total < 1024 * 1024 * 1024) return `${(total / (1024 * 1024)).toFixed(1)} MB`;
    return `${(total / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  gerarGrafico(arquivos: ArquivoResponseDTO[]): void {
    const mapa: Record<number, number> = {};
    arquivos.forEach(a => {
      mapa[a.idEmpresa] = (mapa[a.idEmpresa] ?? 0) + 1;
    });
    const maximo = Math.max(...Object.values(mapa), 1);
    this.dadosGrafico = Object.entries(mapa).map(([id, total]) => ({
      empresa: this.empresas.find(e => e.id === Number(id))?.nomeFantasia ?? '—',
      total,
      percentual: Math.round((total / maximo) * 100)
    })).sort((a, b) => b.total - a.total);
  }

  getNomeEmpresa(idEmpresa: number): string {
    return this.empresas.find(e => e.id === idEmpresa)?.nomeFantasia ?? '—';
  }

  getArquivosPorEmpresa(idEmpresa: number): number {
    return this.arquivos.filter(a => a.idEmpresa === idEmpresa).length;
  }

  getPastasPorEmpresa(idEmpresa: number): number {
    return this.pastas.filter(p => p.idEmpresa === idEmpresa).length;
  }

  formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}