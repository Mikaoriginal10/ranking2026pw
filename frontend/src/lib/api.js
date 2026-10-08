import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getToken = () => localStorage.getItem("admin_token");
export const setToken = (t) => (t ? localStorage.setItem("admin_token", t) : localStorage.removeItem("admin_token"));

export const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export const photoSrc = (s) => (s?.photo_path ? `${API}/files/${s.photo_path}` : s?.photo_url || null);
export const fileSrc = (path) => (path ? `${API}/files/${path}` : null);

export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (!d) return "Algo deu errado. Tente novamente.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || "").join(" ");
  return String(d);
};

export const adminApi = {
  get: (rid) => axios.get(`${API}/admin/ranking`, { ...authHeaders(), params: { ranking_id: rid } }),
  createRanking: (body) => axios.post(`${API}/admin/rankings`, body, authHeaders()),
  updateRanking: (id, title) => axios.put(`${API}/admin/rankings/${id}`, { title }, authHeaders()),
  deleteRanking: (id) => axios.delete(`${API}/admin/rankings/${id}`, authHeaders()),
  setActive: (id) => axios.post(`${API}/admin/active`, { ranking_id: id }, authHeaders()),
  addSeller: (body) => axios.post(`${API}/admin/sellers`, body, authHeaders()),
  bulkAdd: (ranking_id, names) => axios.post(`${API}/admin/sellers/bulk`, { ranking_id, names }, authHeaders()),
  updateSeller: (id, body) => axios.put(`${API}/admin/sellers/${id}`, body, authHeaders()),
  deleteSeller: (id) => axios.delete(`${API}/admin/sellers/${id}`, authHeaders()),
  reorder: (rid, ids) => axios.put(`${API}/admin/rankings/${rid}/order`, { ids }, authHeaders()),
  uploadPhoto: (id, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return axios.post(`${API}/admin/sellers/${id}/photo`, fd, authHeaders());
  },
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return axios.post(`${API}/admin/logo`, fd, authHeaders());
  },
};
