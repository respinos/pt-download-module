<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/alicorn/2021/css/main.css" />
  </xsl:template>

  <xsl:template name="build-text-only-link">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <a id="ssd-link">
      <xsl:attribute name="href">
        <xsl:text>/cgi/ssd?id=</xsl:text>
        <xsl:value-of select="$gHtId"/>
        <xsl:choose>
          <xsl:when test="$seq != '' and $gViewingMode = 'entire-volume'">
            <xsl:text>#seq</xsl:text>
            <xsl:value-of select="$seq" />
          </xsl:when>
          <xsl:when test="$seq">
            <xsl:text>;seq=</xsl:text>
            <xsl:value-of select="$seq" />
          </xsl:when>
          <xsl:otherwise />
        </xsl:choose>
      </xsl:attribute>
      <xsl:text>text-only view of this item.</xsl:text>
    </a>
  </xsl:template>

  <xsl:template name="build-box-main">
    <div class="box-main">
      <xsl:call-template name="build-box-sidebar" />
      <xsl:call-template name="build-box-panels" />
      <xsl:call-template name="build-box-section" />
    </div>
  </xsl:template>

  <xsl:template name="build-box-sidebar">
    <div class="box-sidebar">
      <button data-target="panel-about">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-info-square</xsl:with-param>
        </xsl:call-template>
        <span>About this item</span>
      </button>

      <button data-target="panel-search">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-search</xsl:with-param>
        </xsl:call-template>
        <span>Search inside</span>
      </button>

      <button data-target="panel-download">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-download</xsl:with-param>
        </xsl:call-template>
        <span>Search inside</span>
      </button>

      <button data-target="panel-configure">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-sliders</xsl:with-param>
        </xsl:call-template>
        <span>Configure</span>
      </button>

      <button data-target="panel-get">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-bag-fill</xsl:with-param>
        </xsl:call-template>
        <span>Get this item</span>
      </button>

      <button data-target="panel-share">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-share-fill</xsl:with-param>
        </xsl:call-template>
        <span>Share</span>
      </button>

      <button data-target="panel-bookmark">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-bookmark-fill</xsl:with-param>
        </xsl:call-template>
        <span>Bookmark</span>
      </button>

      <button data-target="panel-bookmark">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-journal-code</xsl:with-param>
        </xsl:call-template>
        <span>Version</span>
      </button>

    </div>
  </xsl:template>

  <xsl:template name="build-box-panels">
    <div class="box-panels">
    </div>
  </xsl:template>

  <xsl:template name="build-box-section">
    <section class="box-reader-main">
      <div class="box-reader">
      </div>
      <div class="box-reader-toolbar">
        <xsl:call-template name="build-box-reader-toolbar-navigator" />
        <xsl:call-template name="build-box-reader-toolbar-paginator" />
      </div>
    </section>
    <script type="application/javascript" src="/alicorn/2021/js/demo.js"></script>
  </xsl:template>

  <xsl:template name="build-box-reader-toolbar-navigator">
    <form class="box-reader-toolbar-navigator">
      <div class="navigator-range-wrap">
        <input class="navigator-range" type="range" min="1" max="50" value="15" />
      </div>
      <div class="navigator-output">
        <span data-slot="seq">15</span>
        <span> / </span>
        <span data-slot="total-seq">50</span>
      </div>
      <button>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-card-list</xsl:with-param>
        </xsl:call-template>
        <span>Jump...</span>
      </button>
    </form>
  </xsl:template>

  <xsl:template name="build-box-reader-toolbar-paginator">
    <div class="box-reader-toolbar-paginator">
      <button aria-label="Previous">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-arrow-left-circle-fill</xsl:with-param>
        </xsl:call-template>
      </button>
      <button aria-label="Next">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-arrow-right-circle-fill</xsl:with-param>
        </xsl:call-template>
      </button>
    </div>
  </xsl:template>

</xsl:stylesheet>