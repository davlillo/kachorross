import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import logo from '@/media/logo.png';

export default function RegistroPage() {
	const navigate = useNavigate();
	const [nombre, setNombre] = useState('');
	const [correo, setCorreo] = useState('');
	const [contrasena, setContrasena] = useState('');
	const [confirmarContrasena, setConfirmarContrasena] = useState('');
	const [rol, setRol] = useState('');
	const [mensaje, setMensaje] = useState('');
	const [isError, setIsError] = useState(false);
	const contrasenasCoinciden = !confirmarContrasena || contrasena === confirmarContrasena;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsError(false);

		// Validación de campos obligatorios
		if (!nombre.trim() || !correo.trim() || !rol || rol === 'select-rol' || !contrasena || !confirmarContrasena) {
			setIsError(true);
			setMensaje('Por favor completa todos los campos.');
			return;
		}

		// Validación de contraseñas
		if (contrasena !== confirmarContrasena) {
			setIsError(true);
			setMensaje('Las contraseñas no coinciden.');
			return;
		}

		setIsError(false);
		setMensaje('Registro preparado. Conecta este formulario con tu backend cuando quieras.');
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative overflow-hidden">
			<div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-purpura-400/12 rounded-full blur-3xl" />
			<div className="pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 bg-azure-blue/12 rounded-full blur-3xl" />
			<div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: 'radial-gradient(circle at 50% 10%, rgba(2,6,23,0.02), transparent 25%), radial-gradient(ellipse at center, rgba(255,255,255,0.0), transparent 60%)' }} />

			<div className="w-full max-w-5xl rounded-2xl shadow-glow overflow-hidden flex flex-col md:flex-row bg-white">
				<div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-purpura-700 to-purpura-500 p-12 flex-col justify-center items-start gap-8 text-white relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/0 pointer-events-none" aria-hidden="true" />
					<svg className="absolute -right-24 -bottom-24 opacity-20" width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
						<defs>
							<linearGradient id="registro-g1" x1="0" x2="1">
								<stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
								<stop offset="100%" stopColor="#06B6D4" stopOpacity="0.06" />
							</linearGradient>
						</defs>
						<circle cx="210" cy="210" r="200" fill="url(#registro-g1)" />
					</svg>

					<div className="flex items-center gap-4 max-w-full">
						<div className="w-44 h-44 flex items-center justify-center shrink-0">
							<img src={logo} alt="Logo" className="w-auto h-full object-contain" />
						</div>
						<div className="max-w-[220px]">
								<h2 className="text-3xl md:text-4xl font-extrabold leading-none tracking-tight break-words">Veterinaria<br />Kachorros</h2>
								<p className="text-sm opacity-90 mt-3">Sistema de Gestión Clínica</p>
						</div>
					</div>
				</div>

				<div className="w-full md:w-1/2 bg-white p-6 md:p-8 flex items-center justify-center">
					<div className="w-full max-w-md">
						<div className="mb-4">
							<h1 className="text-xl font-bold text-center mb-1">Crear cuenta</h1>
							<p className="text-xs text-center text-muted-foreground">Completa los datos para registrar un nuevo usuario</p>
						</div>

								<form onSubmit={handleSubmit} className="space-y-4">
							{mensaje && (
								<Alert
									variant={isError ? 'destructive' : undefined}
									className="max-w-md mx-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-sm"
								>
									{isError ? (
										<XCircle className="h-5 w-5 text-red-500" />
									) : (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									)}
									<AlertDescription className="text-sm">{mensaje}</AlertDescription>
								</Alert>
							)}

							<div>
								<Label htmlFor="nombre">Nombre completo</Label>
												<Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" required className="mt-1 h-11" />
							</div>

							<div>
								<Label htmlFor="correo">Correo electrónico</Label>
												<Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="usuario@kachorros.com" required className="mt-1 h-11" />
							</div>

							<div>
								<Label htmlFor="rol">Rol</Label>
								<Select value={rol} onValueChange={setRol}>
									<SelectTrigger className="mt-1 h-11 w-full">
										<SelectValue placeholder="Selecciona un rol" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="select-rol" disabled>
											Seleccionar un rol
										</SelectItem>
										<SelectItem value="recepcion">Recepción</SelectItem>
										<SelectItem value="doctora">Doctora</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="contrasena">Contraseña</Label>
												<Input id="contrasena" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder="••••••" required className="mt-1 h-11" />
							</div>

							<div>
								<Label htmlFor="confirmar">Confirmar contraseña</Label>
												<Input
													id="confirmar"
													type="password"
													value={confirmarContrasena}
													onChange={(e) => setConfirmarContrasena(e.target.value)}
													placeholder="••••••"
													required
													aria-invalid={!contrasenasCoinciden}
													className={`mt-1 h-11 ${!contrasenasCoinciden ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
												/>
								{!contrasenasCoinciden && (
									<p className="mt-1 text-xs text-red-600">Las contraseñas deben coincidir.</p>
								)}
							</div>

									<div className="flex justify-center pt-1">
										<Button type="submit" className="h-11 min-w-[240px] px-6 text-sm bg-gradient-to-r from-purpura-500 to-purpura-600 text-white font-semibold shadow-md">
											Registrar usuario
										</Button>
									</div>
						</form>

						<div className="mt-4 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-2">
							<span>¿Ya tienes cuenta?</span>
							<button type="button" onClick={() => navigate('/login')} className="font-medium text-purpura-700 hover:underline">
								Volver al login
							</button>
						</div>

						<div className="mt-5 pt-4 border-t border-slate-200 text-center text-xs text-muted-foreground">
							© 2026 Veterinaria Kachorro's
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
