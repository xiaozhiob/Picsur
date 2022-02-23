import { Button, Grid, IconButton, TextField } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetImageURL, ValidateImageHash } from '../../api/images';
import { CreateImageLinks, Debounce } from '../../api/util';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Centered from '../../components/centered/centered';

import './view.css';
import { useSnackbar } from 'notistack';

// Stupid names go brrr
export default function ViewView() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const hash = useParams().hash ?? '';

  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resizeImage = () => {
    if (imgRef.current) imgRef.current.style.height = '0';

    const contentHeight = contentRef.current?.offsetHeight ?? 0;
    const gridHeight = gridRef.current?.offsetHeight ?? 0;
    const newImgHeight = contentHeight - gridHeight;

    if (imgRef.current) imgRef.current.style.height = newImgHeight + 'px';
  };

  useEffect(() => {
    if (!ValidateImageHash(hash)) navigate('/');

    resizeImage();

    const resizeImageDebounced = Debounce(resizeImage, 100);
    window.addEventListener('resize', resizeImageDebounced);
    return () => window.removeEventListener('resize', resizeImageDebounced);
  }, []);

  const imageURL = GetImageURL(hash);
  const imageLinks = CreateImageLinks(imageURL);

  function createCopyField(label: string, value: string) {
    const copy = () => {
      navigator.clipboard.writeText(value);
      enqueueSnackbar(`Copied ${label}!`, { variant: 'success' });
    };
    return (
      <TextField
        label={label}
        defaultValue={value}
        fullWidth={true}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton onClick={copy}>
              <ContentCopyIcon />
            </IconButton>
          ),
        }}
      />
    );
  }

  return (
    <section className="contentwindow">
      <Centered ref={contentRef}>
        <Grid container spacing={2} ref={gridRef}>
          <Grid item xs={12}>
            <h1>Uploaded Image</h1>
          </Grid>
          <Grid item xs={12}>
            <img
              className="uploadedimage"
              alt="Uploaded"
              src={imageURL}
              ref={imgRef}
            />
          </Grid>
          <Grid item xs={12}>
            {createCopyField('Image URL', imageURL)}
          </Grid>
          <Grid item xs={12} sm={6}>
            {createCopyField('Markdown', imageLinks.markdown)}
          </Grid>
          <Grid item xs={12} sm={6}>
            {createCopyField('HTML', imageLinks.html)}
          </Grid>
          <Grid item xs={12} sm={6}>
            {createCopyField('BBCode', imageLinks.bbcode)}
          </Grid>
          <Grid item xs={12} sm={6}>
            {createCopyField('Rst', imageLinks.rst)}
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
            >
              Upload Another
            </Button>
          </Grid>
        </Grid>
      </Centered>
    </section>
  );
}