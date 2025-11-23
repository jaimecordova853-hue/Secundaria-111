import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Save, Upload, Download, Mail, 
  FileText, CheckCircle, XCircle, Clock, ChevronLeft, 
  Share2, X, Edit3, BarChart2, Trash2, Clipboard, 
  Database, Cloud, Loader, RefreshCw, UserCheck, PieChart
  
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCM-ZexCV5l4Hnu5IDFhYL4MMBT3qBxekQ",
  authDomain: "secundaria111-app.firebaseapp.com",
  projectId: "secundaria111-app",
  storageBucket: "secundaria111-app.firebasestorage.app",
  messagingSenderId: "273596277086",
  appId: "1:273596277086:web:55da70fdbc9b15c8606fcf",
  measurementId: "G-59876DECFJ"
};

// Initialize Firebase (solo una vez)
const app = initializeApp(firebaseConfig);

// Analytics solo en navegador (evita error en Vercel)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const db = getFirestore(app);



// Ajuste de seguridad: Usar un ID fijo si no hay variable de entorno
const appId = typeof __app_id !== 'undefined' ? __app_id : 'secundaria-111-app';

// --- COMPONENTES UI ---
const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled, title }) => {
  const baseStyle = "px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    info: "bg-purple-600 text-white hover:bg-purple-700 shadow-md",
    warning: "bg-orange-600 text-white hover:bg-orange-700 shadow-md",
    dark: "bg-gray-800 text-white hover:bg-gray-900 shadow-md"
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children && <span>{children}</span>}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- MODAL REPORTE ---
const StudentReportModal = ({ student, activityInfo, date, classNameInfo, onClose, onCopyEmail, onCopyShort }) => {
  if (!student) return null;
  
  const metaColor = 
    student.metas === 'Alcanzada' ? 'text-green-700 bg-green-50' :
    student.metas === 'No Logrado' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-blue-700 p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Reporte Individual</h2>
          <button onClick={onClose} className="hover:bg-blue-600 p-1 rounded-full"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{student.name}</h3>
            <p className="text-sm text-gray-500">{classNameInfo} • {date}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
             <p className="text-xs font-bold text-blue-600 uppercase mb-1">Actividad: {activityInfo.title || "Sin título"}</p>
             <p className="text-sm text-gray-600 italic">{activityInfo.description || "Sin descripción"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="p-2 bg-gray-50 rounded"><span className="block text-gray-500 text-xs">Asistencia</span><span className={`font-bold ${student.asistencia === 'Falta' ? 'text-red-600' : 'text-green-600'}`}>{student.asistencia}</span></div>
             <div className="p-2 bg-gray-50 rounded"><span className="block text-gray-500 text-xs">Calificación</span><span className="font-bold text-blue-600">{student.calificacion}/10</span></div>
             <div className={`p-2 rounded ${metaColor} border border-opacity-20`}><span className="block opacity-70 text-xs">Meta de Aprendizaje</span><span className="font-bold">{student.metas}</span></div>
             <div className="p-2 bg-gray-50 rounded"><span className="block text-gray-500 text-xs">Conducta</span><span className="font-bold text-gray-800">{student.conducta}</span></div>
             <div className="col-span-2 p-2 bg-gray-50 rounded flex justify-between"><span className="text-gray-500 text-xs">Actividad Entregada</span><span className="font-bold text-gray-800">{student.entrega}%</span></div>
          </div>
          {student.observaciones && (<div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800"><span className="font-bold">Observaciones:</span> {student.observaciones}</div>)}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" icon={Mail} onClick={() => onCopyEmail(student)}>Copiar Email</Button>
            <Button className="flex-1" variant="success" icon={Share2} onClick={() => onCopyShort(student)}>Resumen</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('setup'); 
  const [currentClass, setCurrentClass] = useState({ turno: "", grado: "", grupo: "", asignatura: "", periodo: "1" });
  const [rosterStatus, setRosterStatus] = useState(null);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityInfo, setActivityInfo] = useState({ title: "", description: "" });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- AUTENTICACIÓN ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- IDS DE DOCUMENTOS ---
  const getRosterId = () => `roster_${currentClass.turno}_${currentClass.grado}_${currentClass.grupo}`;
  const getDailyId = () => `daily_${date}_${currentClass.turno}_${currentClass.grado}_${currentClass.grupo}_${currentClass.asignatura}`;

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- CARGAR ÚLTIMA CONFIG ---
  useEffect(() => {
    if (!user) return;
    const loadLastConfig = async () => {
       try {
         const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', 'user_config');
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
           const data = docSnap.data();
           if(data.turno && data.grado) setCurrentClass(data);
         }
       } catch(e) { console.error("Error config", e); }
    };
    loadLastConfig();
  }, [user]);

  // --- VERIFICAR ROSTER EN SETUP ---
  useEffect(() => {
    if (!user || view !== 'setup' || !currentClass.grado || !currentClass.grupo) return;
    const checkRoster = async () => {
       try {
         const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', getRosterId());
         const docSnap = await getDoc(docRef);
         if (docSnap.exists() && docSnap.data().students?.length > 0) {
            setRosterStatus(`${docSnap.data().students.length} alumnos en nube`);
         } else {
            setRosterStatus(null);
         }
       } catch (e) { console.error(e); }
    };
    checkRoster();
  }, [user, currentClass, view]);

  // --- CARGAR DATOS AL ENTRAR AL DASHBOARD ---
  useEffect(() => {
    if (!user || (view !== 'dashboard' && view !== 'reports')) return;
    loadDailyData();
  }, [user, view, date, currentClass]);

  const loadDailyData = async () => {
    setIsSyncing(true);
    const dailyId = getDailyId();

    try {
      const dailyRef = doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', dailyId);
      const dailySnap = await getDoc(dailyRef);

      if (dailySnap.exists()) {
          const data = dailySnap.data();
          setStudents(data.students || []);
          setActivityInfo(data.activityInfo || { title: "", description: "" });
          showNotification("Datos del día cargados de la nube");
      } else {
          setActivityInfo({ title: "", description: "" });
          await forceLoadRoster();
      }
    } catch (e) {
      console.error("Error loading", e);
      showNotification("Error de conexión", "danger");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- FUNCIÓN DE RECUPERACIÓN FORZADA DE LISTA ---
  const forceLoadRoster = async () => {
    setIsSyncing(true);
    try {
        const rosterRef = doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', getRosterId());
        const rosterSnap = await getDoc(rosterRef);
        
        if (rosterSnap.exists()) {
          const roster = rosterSnap.data().students || [];
          const initialized = roster.map(s => ({
              ...s, ...DEFAULT_STUDENT_STATE, id: s.id || Date.now() + Math.random()
          }));
          setStudents(initialized);
          showNotification("Lista de alumnos recuperada exitosamente.");
        } else {
          setStudents([]);
          showNotification("No se encontró lista guardada en la nube.", "warning");
        }
    } catch (e) {
        showNotification("Error recuperando lista", "danger");
    } finally {
        setIsSyncing(false);
    }
  };

  // --- GUARDAR DATOS (CLOUD) ---
  const saveData = async () => {
     if (!user) return;
     setIsSyncing(true);
     try {
        const dailyId = getDailyId();
        const rosterId = getRosterId();
        
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', dailyId), {
           students,
           activityInfo,
           date,
           period: currentClass.periodo,
           classInfo: currentClass
        });

        if (students.length > 0) {
           const simpleRoster = students.map(s => ({ id: s.id, name: s.name }));
           await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', rosterId), {
              students: simpleRoster
           });
        }
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', 'user_config'), currentClass);
        showNotification("☁️ Guardado en la nube exitoso");
     } catch (e) {
        console.error(e);
        showNotification("Error al guardar", "danger");
     } finally {
        setIsSyncing(false);
     }
  };

  // --- LÓGICA DE REPORTES BLINDADA ---
  const fetchPeriodData = async () => {
    setIsSyncing(true);
    try {
        // 1. AUTOGUARDADO ANTES DE GENERAR
        await saveData(); 

        const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'school_data');
        const snapshot = await getDocs(colRef);
        const dailyDocs = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id.startsWith('daily_') && 
                data.classInfo?.turno === currentClass.turno &&
                data.classInfo?.grado === currentClass.grado &&
                data.classInfo?.grupo === currentClass.grupo &&
                data.classInfo?.asignatura === currentClass.asignatura &&
                data.period === currentClass.periodo
            ) {
                dailyDocs.push(data);
            }
        });

        const studentStats = {};
        
        dailyDocs.forEach(day => {
            // --- BLINDAJE CRÍTICO: Verificar que existan alumnos ---
            if (day.students && Array.isArray(day.students)) {
                day.students.forEach(s => {
                    if (!studentStats[s.name]) {
                        studentStats[s.name] = {
                            name: s.name, days: 0, totalGrade: 0, totalEntrega: 0,
                            asistencia: 0, faltas: 0, retardos: 0,
                            exc: 0, good: 0, reg: 0, bad: 0,
                            metaAlc: 0, metaProc: 0, metaNo: 0
                        };
                    }
                    const stat = studentStats[s.name];
                    stat.days++;
                    stat.totalGrade += parseFloat(s.calificacion || 0);
                    stat.totalEntrega += parseFloat(s.entrega || 0);
                    
                    if (s.asistencia === 'Asistencia') stat.asistencia++;
                    if (s.asistencia === 'Falta') stat.faltas++;
                    if (s.asistencia === 'Retardo') stat.retardos++;
                    
                    if (s.conducta === 'Excelente') stat.exc++;
                    if (s.conducta === 'Buena') stat.good++;
                    if (s.conducta === 'Regular') stat.reg++;
                    if (s.conducta === 'Mala') stat.bad++;

                    if (s.metas === 'Alcanzada') stat.metaAlc++;
                    else if (s.metas === 'No Logrado') stat.metaNo++;
                    else stat.metaProc++;
                });
            }
        });
        
        return { dailyDocs, studentStats };

    } catch (e) {
        console.error(e);
        showNotification("Error generando reporte. Intente de nuevo.", "danger");
        return null;
    } finally {
        setIsSyncing(false);
    }
  };

  const generateStudentReport = async () => {
    try {
        const data = await fetchPeriodData();
        if (!data) return;
        const { studentStats } = data;
        
        let csv = "\uFEFF"; 
        csv += "EXPEDIENTE DE PERIODO POR ALUMNO\n";
        csv += `Escuela: ${CONFIG.escuela}\n`;
        csv += `Asignatura: ${currentClass.asignatura} - Grado: ${currentClass.grado} ${currentClass.grupo}\n`;
        csv += `Periodo: ${currentClass.periodo} - Fecha de Corte: ${date}\n\n`;
        
        csv += "Nombre del Alumno,Periodo,Calif. Promedio,Asistencias,Faltas,Retardos,Conducta Excelente (Días),Conducta Buena,Conducta Regular,Conducta Mala,Meta Alcanzada (Días),Meta En Proceso,Meta No Lograda,Entregas Promedio (%)\n";
        
        // SORT SEGURO: (a.name || "")
        Object.values(studentStats)
            .sort((a,b) => (a.name || "").localeCompare(b.name || ""))
            .forEach(s => {
                const avgGrade = s.days > 0 ? (s.totalGrade / s.days).toFixed(1) : "0";
                const avgEntrega = s.days > 0 ? (s.totalEntrega / s.days).toFixed(1) : "0";
                csv += `"${s.name}",${currentClass.periodo},${avgGrade},${s.asistencia},${s.faltas},${s.retardos},${s.exc},${s.good},${s.reg},${s.bad},${s.metaAlc},${s.metaProc},${s.metaNo},${avgEntrega}%\n`;
            });
        
        downloadCSV(csv, `Expediente_Alumnos_P${currentClass.periodo}.csv`);
        showNotification("Expediente de Alumnos descargado");
    } catch(e) {
        console.error(e);
        showNotification("Error al crear el archivo del reporte", "danger");
    }
  };

  const generateGroupReport = async () => {
    try {
        const data = await fetchPeriodData();
        if (!data) return;
        const { studentStats, dailyDocs } = data;
        const studentsArray = Object.values(studentStats);
        const totalStudents = studentsArray.length;
        
        if (totalStudents === 0) {
            showNotification("No hay datos suficientes", "warning");
            return;
        }

        const globalGrade = (studentsArray.reduce((acc, s) => acc + (s.days > 0 ? s.totalGrade / s.days : 0), 0) / totalStudents).toFixed(2);
        const globalEntrega = (studentsArray.reduce((acc, s) => acc + (s.days > 0 ? s.totalEntrega / s.days : 0), 0) / totalStudents).toFixed(2);
        
        const totalRecordedDays = dailyDocs.length;
        const totalPossibleAttendances = totalRecordedDays * totalStudents;
        const totalFaltasGroup = studentsArray.reduce((acc, s) => acc + s.faltas, 0);
        const absencePercent = totalPossibleAttendances > 0 ? ((totalFaltasGroup / totalPossibleAttendances) * 100).toFixed(2) : "0";

        const avgExc = (studentsArray.reduce((acc, s) => acc + s.exc, 0) / totalStudents).toFixed(1);
        const avgBad = (studentsArray.reduce((acc, s) => acc + s.bad, 0) / totalStudents).toFixed(1);

        const avgMetaAlc = (studentsArray.reduce((acc, s) => acc + s.metaAlc, 0) / totalStudents).toFixed(1);
        const avgMetaProc = (studentsArray.reduce((acc, s) => acc + s.metaProc, 0) / totalStudents).toFixed(1);
        const avgMetaNo = (studentsArray.reduce((acc, s) => acc + s.metaNo, 0) / totalStudents).toFixed(1);

        let csv = "\uFEFF";
        csv += "EXPEDIENTE DE PERIODO POR GRUPO\n";
        csv += `Escuela: ${CONFIG.escuela}\n`;
        csv += `Grupo: ${currentClass.grado} ${currentClass.grupo} - ${currentClass.asignatura}\n`;
        csv += `Periodo: ${currentClass.periodo} - Fecha de Corte: ${date}\n\n`;
        
        csv += "METRICA,VALOR\n";
        csv += `Calificación Promedio del Grupo,${globalGrade}\n`;
        csv += `Porcentaje de Inasistencia Grupal,${absencePercent}%\n`;
        csv += `Porcentaje de Actividades Entregadas,${globalEntrega}%\n`;
        
        csv += "\nANÁLISIS DE METAS DE APRENDIZAJE (Días promedio por alumno):\n";
        csv += `Metas Alcanzadas,${avgMetaAlc}\n`;
        csv += `Metas En Proceso,${avgMetaProc}\n`;
        csv += `Metas No Logradas,${avgMetaNo}\n`;

        csv += "\nANÁLISIS DE CONDUCTA PROMEDIO (Días promedio por alumno):\n";
        csv += `Excelente,${avgExc}\n`;
        csv += `Mala,${avgBad}\n`;

        downloadCSV(csv, `Expediente_Grupo_P${currentClass.periodo}.csv`);
        showNotification("Expediente de Grupo descargado");
    } catch(e) {
        console.error(e);
        showNotification("Error al crear el archivo del reporte", "danger");
    }
  };

  const handleFileUpload = async (e) => {
    if (!user) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      const newStudents = rows.map((name, index) => ({
        id: Date.now() + index,
        name: name.replace(/,/g, ''), 
        ...DEFAULT_STUDENT_STATE
      }));
      setStudents(newStudents);
      try {
         const simpleRoster = newStudents.map(s => ({ id: s.id, name: s.name }));
         await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', getRosterId()), {
            students: simpleRoster
         });
         showNotification(`Lista de ${newStudents.length} alumnos subida.`);
         setRosterStatus(`${newStudents.length} alumnos en nube`);
         await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'school_data', 'user_config'), currentClass);
      } catch (e) { console.error(e); showNotification("Error subiendo lista", "danger"); }
    };
    reader.readAsText(file);
  };

  const resetDailyData = () => {
    if (window.confirm("¿Limpiar datos de hoy?")) {
      setStudents(prev => prev.map(s => ({ ...s, ...DEFAULT_STUDENT_STATE })));
      showNotification("Reiniciado.");
    }
  };

  const updateStudent = (id, field, value) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- DESCARGA SEGURA CON BLOB (Evita Crash) ---
  const downloadCSV = (content, filename) => {
    try {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(e) {
        console.error("Error download", e);
        showNotification("Error descargando archivo", "danger");
    }
  };

  const exportDailyCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Periodo: ${currentClass.periodo}, Fecha: ${date}, Actividad: ${activityInfo.title}\n`;
    csvContent += "Nombre,Asistencia,Actividad(%),Meta de Aprendizaje,Conducta,Calificacion,Observaciones\n";
    students.forEach(s => {
      csvContent += `${s.name},${s.asistencia},${s.entrega}%,${s.metas},${s.conducta},${s.calificacion},${s.observaciones}\n`;
    });
    downloadCSV(csvContent, `Diario_${date}.csv`);
  };

  const generateEmailText = (student) => {
    return `ASUNTO: Reporte Escolar - ${student.name} - ${date}\nMATERIA: ${currentClass.asignatura}\n\nACTIVIDAD: ${activityInfo.title || "Clase regular"}\n${activityInfo.description}\n\nDESEMPEÑO:\nAsistencia: ${student.asistencia}\nMeta de Aprendizaje: ${student.metas}\nEntrega: ${student.entrega}%\nCalificación: ${student.calificacion}\nConducta: ${student.conducta}\n\n${student.observaciones}`;
  };

  const copyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification("Copiado");
    } catch (err) { showNotification("Error al copiar", "danger"); }
  };

  const getClassInfoString = () => `${currentClass.grado} "${currentClass.grupo}" • ${currentClass.turno}`;

  // --- UI START ---
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600"><Loader className="animate-spin" size={32}/></div>;

  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-800">{CONFIG.escuela}</h1>
            <p className="text-gray-500 text-sm">Sistema Escolar en la Nube ☁️</p>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
               <label className="block text-sm font-bold text-yellow-800 mb-2 text-center">PERIODO</label>
               <div className="flex justify-center gap-4">
                  {CONFIG.periodos.map(p => (
                    <button key={p} onClick={() => setCurrentClass({...currentClass, periodo: p})} className={`w-12 h-12 rounded-full font-bold text-lg border-2 ${currentClass.periodo === p ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-white'}`}>{p}</button>
                  ))}
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
              <div className="grid grid-cols-2 gap-2">
                {CONFIG.turnos.map(t => (
                  <button key={t} onClick={() => setCurrentClass({...currentClass, turno: t})} className={`p-3 rounded-lg border text-sm ${currentClass.turno === t ? 'bg-blue-100 border-blue-500 font-bold' : ''}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                    <select className="block w-full p-2 border rounded-lg" value={currentClass.grado} onChange={(e) => setCurrentClass({...currentClass, grado: e.target.value, asignatura: ""})}>
                      <option value="">...</option>{CONFIG.grados.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                    <select className="block w-full p-2 border rounded-lg" value={currentClass.grupo} onChange={(e) => setCurrentClass({...currentClass, grupo: e.target.value})}>
                      <option value="">...</option>{CONFIG.grupos.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>
            {currentClass.grado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
                <select className="block w-full p-2 border rounded-lg" value={currentClass.asignatura} onChange={(e) => setCurrentClass({...currentClass, asignatura: e.target.value})}>
                  <option value="">Seleccione...</option>{CONFIG.asignaturas[currentClass.grado].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {rosterStatus ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <Cloud size={18} /> <span className="text-sm font-medium">{rosterStatus}</span>
              </div>
            ) : (currentClass.grado && currentClass.grupo && (
              <div className="flex items-center gap-2 p-3 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 border-dashed text-sm">
                <Cloud size={18} /> Sin lista en la nube. Sube un CSV adentro.
              </div>
            ))}
            <Button className="w-full mt-4" onClick={() => setView('dashboard')} disabled={!currentClass.turno || !currentClass.grado || !currentClass.grupo || !currentClass.asignatura}>
              Entrar al Sistema
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-800 text-white p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={() => setView('setup')} className="p-1 hover:bg-blue-700 rounded"><ChevronLeft /></button>
             <div>
               <div className="flex items-center gap-2">
                 <h1 className="font-bold text-lg leading-tight truncate max-w-[150px]">{currentClass.asignatura}</h1>
                 <span className="bg-yellow-500 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-full">P{currentClass.periodo}</span>
               </div>
               <p className="text-blue-200 text-xs">{getClassInfoString()}</p>
             </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center bg-blue-900 rounded px-2 py-1 border border-blue-600">
               <Calendar size={14} className="mr-2 text-blue-300" />
               <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-white font-mono text-sm outline-none cursor-pointer w-28" />
            </div>
            {isSyncing && <span className="text-xs text-blue-200 mt-1 flex items-center"><RefreshCw size={10} className="animate-spin mr-1"/> Sincronizando...</span>}
          </div>
        </div>
      </header>

      {notification && (<div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-xl z-50 animate-bounce">{notification.msg}</div>)}
      {selectedStudent && (<StudentReportModal student={selectedStudent} activityInfo={activityInfo} date={date} classNameInfo={getClassInfoString()} onClose={() => setSelectedStudent(null)} onCopyEmail={(s) => copyToClipboard(generateEmailText(s))} onCopyShort={(s) => copyToClipboard(`${s.name} - ${s.calificacion}`)}/>)}

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {view !== 'periodReport' && (
          <>
            <Card className="p-4 bg-blue-50 border-blue-200">
               <div className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 p-2 rounded-full text-blue-600 hidden sm:block"><Edit3 size={20} /></div>
                  <div className="flex-1 space-y-3">
                     <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">Actividad</label>
                        <input type="text" placeholder="Título..." className="w-full p-2 border border-blue-200 rounded outline-none" value={activityInfo.title} onChange={(e) => setActivityInfo({...activityInfo, title: e.target.value})}/>
                     </div>
                     <input type="text" placeholder="Descripción..." className="w-full p-2 border border-blue-200 rounded outline-none text-sm" value={activityInfo.description} onChange={(e) => setActivityInfo({...activityInfo, description: e.target.value})}/>
                  </div>
               </div>
            </Card>

            <div className="flex flex-wrap gap-2 justify-between items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm sticky top-[4.5rem] z-20">
               <div className="flex gap-2 items-center flex-wrap">
                 <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 border border-gray-300"><Upload size={16} /> <span className="hidden sm:inline">CSV</span><input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
                 
                 {/* BOTON DE RECUPERACIÓN DE LISTA */}
                 <button onClick={forceLoadRoster} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium border border-blue-200" title="Recuperar lista guardada"><Download size={16} /></button>
                 
                 <button onClick={resetDailyData} className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium border border-red-200"><Trash2 size={16} /></button>
                 <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>
                 <Button onClick={exportDailyCSV} variant="success" icon={FileText} title="Reporte Diario en Excel"><span className="hidden sm:inline">Diario</span></Button>
                 <Button onClick={generateStudentReport} variant="info" icon={UserCheck} title="Expediente Periodo Alumnos"><span className="hidden sm:inline">Exp. Alumnos</span></Button>
                 <Button onClick={generateGroupReport} variant="warning" icon={PieChart} title="Expediente Periodo Grupo"><span className="hidden sm:inline">Exp. Grupo</span></Button>
               </div>
               <div className="flex gap-2">
                  <Button onClick={() => setView(view === 'dashboard' ? 'reports' : 'dashboard')} variant="secondary">{view === 'dashboard' ? 'Reportes' : 'Lista'}</Button>
                  <Button onClick={saveData} icon={Save} disabled={isSyncing}>{isSyncing ? '...' : 'Guardar'}</Button>
               </div>
            </div>

            {view === 'dashboard' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.length === 0 && (<div className="col-span-full text-center py-10 text-gray-400"><Cloud size={48} className="mx-auto mb-4 opacity-30"/><p>No hay alumnos cargados para este grupo.</p><p className="text-sm">Sube un archivo CSV con los nombres o pulsa el botón azul de "Recuperar Lista".</p></div>)}
                {students.map((student) => (
                  <Card key={student.id} className="p-4 relative">
                    <div className="flex justify-between items-start mb-3"><h3 onClick={() => setSelectedStudent(student)} className="font-bold text-gray-800 text-lg truncate cursor-pointer hover:text-blue-600">{student.name}</h3></div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between bg-gray-50 p-1 rounded">
                         <button onClick={() => updateStudent(student.id, 'asistencia', 'Asistencia')} className={`flex-1 flex justify-center py-1 rounded ${student.asistencia === 'Asistencia' ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}><CheckCircle size={18}/></button>
                         <button onClick={() => updateStudent(student.id, 'asistencia', 'Retardo')} className={`flex-1 flex justify-center py-1 rounded ${student.asistencia === 'Retardo' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}><Clock size={18}/></button>
                         <button onClick={() => updateStudent(student.id, 'asistencia', 'Falta')} className={`flex-1 flex justify-center py-1 rounded ${student.asistencia === 'Falta' ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}><XCircle size={18}/></button>
                      </div>
                      <div className="flex items-center gap-2"><span className="text-gray-500 w-16">Entrega:</span><input type="range" min="0" max="100" step="10" value={student.entrega} onChange={(e) => updateStudent(student.id, 'entrega', e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer" /><span className="font-bold w-8 text-right text-blue-600">{student.entrega}%</span></div>
                      
                      {/* NUEVO SELECTOR DE METAS */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16 text-xs">Meta:</span>
                        <select 
                          value={student.metas} 
                          onChange={(e) => updateStudent(student.id, 'metas', e.target.value)}
                          className={`flex-1 text-xs p-1 rounded border font-bold ${
                            student.metas === 'Alcanzada' ? 'text-green-700 bg-green-50 border-green-200' : 
                            student.metas === 'No Logrado' ? 'text-red-700 bg-red-50 border-red-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <option value="En proceso">🟡 En Proceso</option>
                          <option value="Alcanzada">🟢 Alcanzada</option>
                          <option value="No Logrado">🔴 No Logrado</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                         <select value={student.conducta} onChange={(e) => updateStudent(student.id, 'conducta', e.target.value)} className="flex-1 bg-white border rounded px-1 text-xs py-1"><option>Excelente</option><option>Buena</option><option>Regular</option><option>Mala</option></select>
                         <div className="flex items-center gap-1 bg-blue-50 px-2 rounded border border-blue-100"><span className="text-xs text-blue-800 font-bold">Calif:</span><input type="number" max="10" min="0" value={student.calificacion} onChange={(e) => updateStudent(student.id, 'calificacion', e.target.value)} className="w-10 bg-transparent text-center font-bold text-blue-800 outline-none"/></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {view === 'reports' && (
               <div className="grid gap-4 md:grid-cols-2">
                  {students.map(student => (
                    <Card key={student.id} className="p-4 flex flex-col justify-between bg-gray-50">
                       <div className="flex justify-between items-start"><h3 className="font-bold text-gray-800">{student.name}</h3><span className={`text-xs px-2 py-1 rounded-full font-bold ${student.asistencia === 'Falta' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{student.asistencia}</span></div>
                       <div className="mt-4 flex gap-2"><Button className="flex-1 text-xs h-8" icon={Mail} onClick={() => copyToClipboard(generateEmailText(student))}>Correo</Button></div>
                    </Card>
                  ))}
               </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}