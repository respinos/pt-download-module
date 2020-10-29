<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dlxs="http://dlxs.org">

  <!-- transform.xml is processed by the middleware into an internally
       referenced XSL stylesheet. This allows fallback processing of the
       stylesheets imported into the top-level stylesheet. The top-level
       stylesheet is normally specified by the <?xml-stylesheet
       type="text/xsl" href="somestylesheet.xsl"?> processing instruction
       (PI) in the top-level XML file.  In the absence of that PI, an XML
       XslFileList node must be present in the top-level XML file
       to list the XSL files which should appear in XSL import statements
       to replace the XSL_FILE_LIST PI below. -->

<xsl:import href="mdp-web/xsl2htmlutils.xsl"></xsl:import>
<xsl:import href="mdp-web/coins.xsl"></xsl:import>
<xsl:import href="mdp-web/alicorn/skeleton.xsl"></xsl:import>
<xsl:import href="alicorn/common.xsl"></xsl:import>
<xsl:import href="mdp-web/js_utils.xsl"></xsl:import>
<xsl:import href="mdp-web/loads.xsl"></xsl:import>
<!-- <xsl:import href="/htapps/roger.babel/pt/web/loads_helper_pt.xsl"></xsl:import> -->
<xsl:import href="mdp-web/coll.xsl"></xsl:import>
<xsl:import href="mdp-web/skin.xsl"></xsl:import>
<xsl:import href="alicorn/str.replace.function.xsl"></xsl:import>
<xsl:import href="alicorn/2021/pageviewer.xsl"></xsl:import>
<xsl:import href="alicorn/2021/pageviewer_volume.xsl"></xsl:import>


  <!-- <xsl:output
      method="xml"
      indent="yes"
      encoding="utf-8"
      omit-xml-declaration="yes"
      doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN"
      doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
      /> -->

  <xsl:output method="html" version="1.0" encoding="utf-8" indent="yes" doctype-system="about:legacy-compat" />      

<!-- Our output is technically more accurate to the Transitional DTD -->
<!-- <xsl:output
    method="xml"
    indent="yes"
    encoding="utf-8"
    omit-xml-declaration="yes"
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"
    doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"
    /> -->

  <!-- This doctype spec does not work because out current output is not valid vs. this dtd: 
       http://www.w3.org/TR/2011/WD-rdfa-in-html-20110113/ -->

  <!--xsl:output
    method="xml"
    indent="yes"
    encoding="utf-8"
    omit-xml-declaration="yes"
    doctype-system="http://www.w3.org/MarkUp/DTD/html401-rdfa11-1.dtd"
    doctype-public="-//W3C//DTD HTML 4.01+RDFa 1.1//EN"
    /-->
  
  <xsl:strip-space elements="*"/>

</xsl:stylesheet>
