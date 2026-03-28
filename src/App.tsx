import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { FileUpload, Description, AccountCircle, Dashboard } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [contracts, setContracts] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'RENTAL_AGREEMENT'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', (event.target as HTMLFormElement).file.files[0]);
    formData.append('title', uploadForm.title);
    formData.append('type', uploadForm.type);

    try {
      const response = await fetch('/api/contracts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('合同上传成功！');
        setUploadDialog(false);
        setUploadForm({ title: '', type: 'RENTAL_AGREEMENT' });
        // 刷新合同列表
        fetchContracts();
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contracts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setContracts(data.contracts);
      }
    } catch (err) {
      setError('获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  React.useEffect(() => {
    fetchContracts();
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <FileUpload sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI 合同阅读助手
          </Typography>
          <Button color="inherit">
            <AccountCircle sx={{ mr: 1 }} />
            用户
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="contract tabs"
          >
            <Tab label="合同管理" icon={<Description />} iconPosition="start" />
            <Tab label="分析报告" icon={<Dashboard />} iconPosition="start" />
            <Tab label="个人设置" icon={<AccountCircle />} iconPosition="start" />
          </Tabs>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">我的合同</Typography>
            <Button
              variant="contained"
              onClick={() => setUploadDialog(true)}
              startIcon={<FileUpload />}
            >
              上传合同
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {contracts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    还没有上传任何合同，点击"上传合同"开始使用
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {contracts.map((contract: any) => (
                    <Paper key={contract.id} sx={{ p: 3, mb: 2 }}>
                      <Typography variant="h6">{contract.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {contract.type} • {new Date(contract.createdAt).toLocaleDateString()}
                      </Typography>
                      {contract.analysis && (
                        <Box mt={2}>
                          <Typography variant="body2">
                            <strong>摘要：</strong>{contract.analysis.summary}
                          </Typography>
                          <Typography variant="body2">
                            <strong>关键条款：</strong>
                            {contract.analysis.keyTerms?.join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" sx={{ mb: 3 }}>分析报告</Typography>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              选择合同进行AI分析，获取智能解读和法律建议
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" sx={{ mb: 3 }}>个人设置</Typography>
          <Paper sx={{ p: 4 }}>
            <Typography color="textSecondary">
              用户个人设置和管理功能
            </Typography>
          </Paper>
        </TabPanel>
      </Container>

      {/* 上传合同对话框 */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>上传合同</DialogTitle>
        <DialogContent>
          <form id="uploadForm">
            <TextField
              margin="normal"
              required
              fullWidth
              label="合同标题"
              name="title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="合同类型"
              name="type"
              value={uploadForm.type}
              onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
              SelectProps={{ native: true }}
              sx={{ mt: 2 }}
            >
              <option value="RENTAL_AGREEMENT">租赁合同</option>
              <option value="EMPLOYMENT_CONTRACT">劳动合同</option>
              <option value="SERVICE_AGREEMENT">服务协议</option>
              <option value="SALES_CONTRACT">销售合同</option>
              <option value="PARTNERSHIP_AGREEMENT">合伙协议</option>
              <option value="NDA">保密协议</option>
              <option value="OTHER">其他</option>
            </TextField>
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                id="file"
                name="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                onClick={() => document.getElementById('file')?.click()}
                fullWidth
              >
                选择文件（PDF或DOCX）
              </Button>
              {uploadForm.title && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  已选择: {uploadForm.title}
                </Typography>
              )}
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>取消</Button>
          <Button
            type="submit"
            form="uploadForm"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '上传'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;